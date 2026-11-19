'use strict';

/**
 * @module v2/core/idempotency
 * @description Idempotency engine for financial & mutating operations with 30s lease lock
 */

const crypto = require('crypto');
const redisCacheService = require('../../services/redisCacheService');
const { ValidationError, ConflictError } = require('./errors');

const LEASE_LOCK_SECONDS = 30;
const COMPLETED_TTL_SECONDS = 86400; // 24 hours

function hashPayload(payload) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Idempotency middleware factory for mutating endpoints
 */
function requireIdempotency({ isRequired = true } = {}) {
  return async (req, res, next) => {
    const rawKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

    if (!rawKey) {
      if (isRequired) {
        return next(
          new ValidationError('العمليات المالية وتعديل الطلبات تتطلب إرسال هيدر Idempotency-Key لضمان عدم التكرار', {
            field: 'Idempotency-Key',
          })
        );
      }
      return next();
    }

    const companyId = req.authContext?.companyId || 'global';
    const endpoint = `${req.method}:${req.baseUrl}${req.path}`;
    const redisKey = `v2:idemp:${companyId}:${endpoint}:${rawKey}`;
    const payloadHash = hashPayload(req.body);

    try {
      const existing = await redisCacheService.get(redisKey);

      if (existing) {
        // Check payload hash
        if (existing.payloadHash && existing.payloadHash !== payloadHash) {
          return next(
            new ConflictError('تم استخدام نفس مفتاح Idempotency-Key مسبقاً ببيانات مختلفة', {
              subCode: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
            })
          );
        }

        // Check in-progress lease
        if (existing.status === 'IN_PROGRESS') {
          return next(
            new ConflictError('العملية قيد التنفيذ حالياً، يرجى الانتظار بضع ثوانٍ قبل إعادة المحاولة', {
              subCode: 'IDEMPOTENCY_IN_PROGRESS',
            })
          );
        }

        // Return cached completion
        if (existing.status === 'COMPLETED' && existing.response) {
          res.setHeader('X-Idempotent-Replay', 'true');
          return res.status(existing.response.statusCode || 200).json(existing.response.body);
        }
      }

      // Acquire 30s lease lock
      await redisCacheService.set(
        redisKey,
        {
          status: 'IN_PROGRESS',
          payloadHash,
          startedAt: Date.now(),
        },
        LEASE_LOCK_SECONDS
      );

      // Intercept response to cache result on completion
      const originalJson = res.json.bind(res);
      res.json = function (body) {
        const statusCode = res.statusCode || 200;
        if (statusCode >= 200 && statusCode < 300) {
          // Cache successful execution for 24h
          redisCacheService
            .set(
              redisKey,
              {
                status: 'COMPLETED',
                payloadHash,
                response: { statusCode, body },
                completedAt: Date.now(),
              },
              COMPLETED_TTL_SECONDS
            )
            .catch(() => {});
        } else {
          // On client/server error, remove lease so client can fix and retry
          redisCacheService.del(redisKey).catch(() => {});
        }

        return originalJson(body);
      };

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  requireIdempotency,
};
