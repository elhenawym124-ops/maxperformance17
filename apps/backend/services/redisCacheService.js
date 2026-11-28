let Redis = null;
try {
    Redis = require('ioredis');
} catch (e) {
    Redis = null;
}
const redisConfig = require('../config/redis');

class RedisCacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.MAX_RETRIES = 3;
        this.localCache = new Map(); // Local fallback cache

        this._initializeClient();
    }

    _initializeClient() {
        try {
            // Skip Redis initialization if ioredis is not installed or configuration is not available
            if (!Redis || !redisConfig) {
                console.log('⚠️ [REDIS] Disabled - ' + (!Redis ? 'ioredis package not installed' : 'Configuration not found') + '. Using local memory cache.');
                this.client = null;
                this.isConnected = false;
                return;
            }

            this.client = redisConfig.url
                ? new Redis(redisConfig.url, redisConfig)
                : new Redis(redisConfig);

            this.client.on('connect', () => {
                console.log('✅ [REDIS] Connected successfully');
                this.isConnected = true;
                this.connectionRetries = 0;
            });

            this.client.on('error', (err) => {
                console.error('❌ [REDIS] Connection Error:', err.message);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                this.isConnected = false;
            });

        } catch (error) {
            console.error('❌ [REDIS] Initialization Failed:', error);
        }
    }

    /**
     * Get value from cache (Checks local cache ONLY if Redis is down/errored)
     * @param {string} key 
     * @returns {Promise<any|null>}
     */
    async get(key) {
        if (process.env.NODE_ENV === 'test') {
            return null;
        }
        // 1. Try Redis first
        if (this.isConnected && this.client) {
            try {
                const value = await this.client.get(key);
                if (value === null || value === undefined) {
                    // Explicit Redis miss: purge stale per-worker localCache entry
                    this.localCache.delete(key);
                    return null;
                }
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            } catch (error) {
                console.error(`❌ [REDIS] Get Error (${key}):`, error.message);
            }
        }

        // 2. Fallback to local cache ONLY when Redis is disconnected or throws an error
        const localValue = this.localCache.get(key);
        if (localValue && localValue.expiry > Date.now()) {
            return localValue.data;
        } else if (localValue) {
            this.localCache.delete(key);
        }

        return null;
    }

    /**
     * Set value in cache (Sets both Redis and local)
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds 
     */
    async set(key, value, ttlSeconds = 300) {
        // Update local cache
        this.localCache.set(key, {
            data: value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });

        // Update Redis
        if (this.isConnected && this.client) {
            try {
                const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                if (ttlSeconds) {
                    await this.client.set(key, stringValue, 'EX', ttlSeconds);
                } else {
                    await this.client.set(key, stringValue);
                }
                return true;
            } catch (error) {
                console.error(`❌ [REDIS] Set Error (${key}):`, error.message);
                return false;
            }
        }

        return true;
    }

    /**
     * Delete value from cache
     * @param {string} key 
     */
    async del(key) {
        this.localCache.delete(key);
        if (this.isConnected && this.client) {
            try {
                await this.client.del(key);
                return true;
            } catch (error) {
                console.error(`❌ [REDIS] Del Error (${key}):`, error.message);
                return false;
            }
        }
        return true;
    }

    /**
     * Delete keys matching a pattern (e.g. "public_products:comp123:*")
     * @param {string} pattern
     */
    async delPattern(pattern) {
        if (!pattern) return false;

        const escapedPattern = String(pattern)
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*');
        const regexPattern = new RegExp(`^${escapedPattern}$`);
        for (const localKey of this.localCache.keys()) {
            if (regexPattern.test(localKey)) {
                this.localCache.delete(localKey);
            }
        }

        if (this.isConnected && this.client) {
            try {
                const stream = this.client.scanStream({
                    match: pattern,
                    count: 100
                });

                return new Promise((resolve) => {
                    stream.on('data', async (keys = []) => {
                        if (keys.length > 0) {
                            stream.pause();
                            try {
                                const pipeline = this.client.pipeline();
                                keys.forEach(key => pipeline.del(key));
                                await pipeline.exec();
                            } catch (err) {
                                console.error(`❌ [REDIS] DelPattern batch error:`, err.message);
                            }
                            stream.resume();
                        }
                    });

                    stream.on('end', () => resolve(true));
                    stream.on('error', (err) => {
                        console.error(`❌ [REDIS] DelPattern Error (${pattern}):`, err.message);
                        resolve(false);
                    });
                });
            } catch (error) {
                console.error(`❌ [REDIS] DelPattern Scan Error (${pattern}):`, error.message);
                return false;
            }
        }
        return true;
    }

    /**
     * Clear all cache (Use carefully)
     */
    async flush() {
        this.localCache.clear();
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.flushdb();
            console.warn('⚠️ [REDIS] Flushed all keys');
            return true;
        } catch (error) {
            console.error('❌ [REDIS] Flush Error:', error.message);
            return false;
        }
    }

    /**
     * Acquire a distributed lock with automatic expiration (TTL)
     * Supports multi-process cluster mode via Redis with safe local fallback
     * @param {string} key Lock key (e.g. "lock:turbo:comp123:order456")
     * @param {number} ttlSeconds Expiration in seconds (default 60s)
     * @returns {Promise<{ acquired: boolean, token: string|null, key: string, isRedis: boolean }>}
     */
    async acquireLock(key, ttlSeconds = 60) {
        if (!key) return { acquired: false, token: null, key: '', isRedis: false };
        const token = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        if (this.isConnected && this.client) {
            try {
                const res = await this.client.set(key, token, 'EX', ttlSeconds, 'NX');
                if (res === 'OK') {
                    return { acquired: true, token, key, isRedis: true };
                }
                return { acquired: false, token: null, key, isRedis: true };
            } catch (err) {
                console.warn(`⚠️ [REDIS] acquireLock failed for ${key}, falling back to memory:`, err.message);
            }
        }

        // Local in-memory lock fallback
        const now = Date.now();
        const existing = this.localCache.get(key);
        if (existing && existing.expiry > now) {
            return { acquired: false, token: null, key, isRedis: false };
        }
        this.localCache.set(key, { data: token, expiry: now + (ttlSeconds * 1000) });
        return { acquired: true, token, key, isRedis: false };
    }

    /**
     * Release a distributed lock safely using token verification
     * @param {{ key: string, token: string, isRedis?: boolean }} lockHandle
     * @returns {Promise<boolean>}
     */
    async releaseLock(lockHandle) {
        if (!lockHandle || !lockHandle.key) return false;
        const { key, token, isRedis } = lockHandle;
        let released = false;

        if (isRedis && this.isConnected && this.client) {
            try {
                const luaScript = `
                    if redis.call("get", KEYS[1]) == ARGV[1] then
                        return redis.call("del", KEYS[1])
                    else
                        return 0
                    end
                `;
                const res = await this.client.eval(luaScript, 1, key, token);
                released = (res === 1);
            } catch (err) {
                console.warn(`⚠️ [REDIS] releaseLock evaluation failed for ${key}:`, err.message);
                try {
                    const currentVal = await this.client.get(key);
                    if (currentVal === token) {
                        await this.client.del(key);
                        released = true;
                    }
                } catch (_) {}
            }
        }

        // Also clean local cache
        const local = this.localCache.get(key);
        if (local && (!token || local.data === token)) {
            this.localCache.delete(key);
            released = true;
        }

        return released;
    }
}

// Singleton instance
const redisCacheService = new RedisCacheService();
module.exports = redisCacheService;
