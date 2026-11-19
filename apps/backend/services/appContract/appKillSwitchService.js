/**
 * App Kill Switch Service
 * 
 * Provides an instant, sub-millisecond, zero-deployment emergency shutoff
 * for any modular tool or marketplace app across the platform.
 * 
 * When a kill switch is active:
 * - All tool endpoints immediately return 403/503 APP_KILL_SWITCH_ACTIVE
 * - The tool is flagged in the catalog and client apps
 * - Zero impact on other apps, tenants, or core infrastructure
 */

const redisCacheService = require('../redisCacheService');

class AppKillSwitchService {
  constructor() {
    // In-memory map of active kill switches for instantaneous response
    this.localKillSwitches = new Map();
    this.REDIS_KEY_PREFIX = 'maxp:app:killswitch:';

    // Auto-hydrate from Redis if available
    this.initFromRedis().catch(() => {});
  }

  /**
   * Hydrates active kill switches from Redis on process boot
   */
  async initFromRedis() {
    try {
      if (redisCacheService?.isConnected && redisCacheService?.client) {
        const keys = await redisCacheService.client.keys(`${this.REDIS_KEY_PREFIX}*`);
        for (const key of keys) {
          const val = await redisCacheService.client.get(key);
          if (val) {
            const payload = JSON.parse(val);
            if (payload?.active && payload.slug) {
              this.localKillSwitches.set(payload.slug.toLowerCase(), payload);
            }
          }
        }
      }
    } catch (_) {}
  }

  /**
   * Check if an app's kill switch is currently active (sync fast-path)
   * @param {string} slug - App / Tool slug
   * @returns {boolean}
   */
  isKillSwitchActive(slug) {
    if (!slug) return false;
    const normalized = String(slug).trim().toLowerCase();
    const entry = this.localKillSwitches.get(normalized);
    if (!entry) return false;
    return Boolean(entry.active);
  }

  /**
   * Check if an app's kill switch is active with async Redis fallback
   */
  async isKillSwitchActiveAsync(slug) {
    if (this.isKillSwitchActive(slug)) return true;
    if (!slug) return false;
    const normalized = String(slug).trim().toLowerCase();
    try {
      if (redisCacheService?.isConnected && redisCacheService?.client) {
        const key = `${this.REDIS_KEY_PREFIX}${normalized}`;
        const val = await redisCacheService.client.get(key);
        if (val) {
          const payload = JSON.parse(val);
          if (payload?.active) {
            this.localKillSwitches.set(normalized, payload);
            return true;
          }
        }
      }
    } catch (_) {}
    return false;
  }

  /**
   * Get kill switch metadata for an app
   * @param {string} slug 
   * @returns {{ active: boolean, reason?: string, activatedAt?: string, updatedBy?: string } | null}
   */
  getKillSwitchStatus(slug) {
    if (!slug) return null;
    const normalized = String(slug).trim().toLowerCase();
    return this.localKillSwitches.get(normalized) || { active: false };
  }

  /**
   * Set kill switch state for an app
   * @param {string} slug - App / Tool slug
   * @param {boolean} active - True to activate emergency shutoff, false to restore
   * @param {Object} [meta] - Metadata (reason, user, etc.)
   */
  async setKillSwitch(slug, active, meta = {}) {
    if (!slug) throw new Error('App slug is required to set kill switch');
    const normalized = String(slug).trim().toLowerCase();
    const payload = {
      slug: normalized,
      active: Boolean(active),
      reason: meta.reason || (active ? 'Emergency shutoff triggered by Super Admin' : 'Deactivated'),
      activatedAt: active ? (meta.activatedAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString(),
      updatedBy: meta.updatedBy || 'SUPER_ADMIN'
    };

    if (active) {
      this.localKillSwitches.set(normalized, payload);
      console.warn(`🚨 [KILL SWITCH] Activated for app: "${normalized}". Reason: ${payload.reason}`);
    } else {
      this.localKillSwitches.delete(normalized);
      console.log(`✅ [KILL SWITCH] Deactivated for app: "${normalized}".`);
    }

    // Best-effort Redis sync for multi-instance clusters
    try {
      if (redisCacheService?.isConnected && redisCacheService?.client) {
        const key = `${this.REDIS_KEY_PREFIX}${normalized}`;
        if (active) {
          await redisCacheService.client.set(key, JSON.stringify(payload));
        } else {
          await redisCacheService.client.del(key);
        }
      }
    } catch (err) {
      console.error('[KILL SWITCH] Redis sync warning:', err.message);
    }

    return payload;
  }

  /**
   * Returns a map of all apps with active kill switches
   * @returns {Object}
   */
  getAllActive() {
    const result = {};
    for (const [slug, entry] of this.localKillSwitches.entries()) {
      if (entry.active) {
        result[slug] = entry;
      }
    }
    return result;
  }

  /**
   * Reset all kill switches (primarily for test tear-downs)
   */
  clearAll() {
    this.localKillSwitches.clear();
  }
}

const appKillSwitchService = new AppKillSwitchService();
module.exports = appKillSwitchService;
module.exports.AppKillSwitchService = AppKillSwitchService;
