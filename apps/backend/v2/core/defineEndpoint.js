'use strict';

/**
 * @module v2/core/defineEndpoint
 * @description Declarative endpoint builder enforcing permissionKey, authentication,
 * scoping, idempotency, masking, and response envelopes.
 */

const { authContextMiddleware } = require('./authContext');
const { requirePermission } = require('./rbac');
const { applyScoping } = require('./scoping');
const { requireIdempotency } = require('./idempotency');
const { sanitizeMaskedInput, maskSensitiveFields } = require('./fieldMasking');
const { sendSuccess, sendError } = require('./responseEnvelope');
const { ValidationError } = require('./errors');

function defineEndpoint(router, {
  method = 'get',
  path,
  permission,
  allowedScopes = ['ALL', 'BRANCH', 'TEAM', 'OWN'],
  idempotent = false,
  validate = null,
  handler,
}) {
  // ─── 1. Fail-Closed Validation ──────────────────────────────────────────────
  if (!permission || typeof permission !== 'string') {
    throw new Error(`FAIL-CLOSED: Endpoint [${method.toUpperCase()} ${path}] MUST declare an explicit permission key.`);
  }

  if (!handler || typeof handler !== 'function') {
    throw new Error(`FAIL-CLOSED: Endpoint [${method.toUpperCase()} ${path}] MUST declare a handler function.`);
  }

  const httpMethod = method.toLowerCase();
  if (typeof router[httpMethod] !== 'function') {
    throw new Error(`Invalid HTTP method [${method}] on endpoint [${path}]`);
  }

  // ─── 2. Build Pipeline Middleware Chain ─────────────────────────────────────
  const pipeline = [
    authContextMiddleware,
    requirePermission(permission),
    applyScoping(),
  ];

  if (idempotent) {
    pipeline.push(requireIdempotency({ isRequired: true }));
  }

  // Optional Joi/Schema validator
  if (validate) {
    pipeline.push((req, res, next) => {
      try {
        if (typeof validate === 'function') {
          validate(req);
        } else if (validate.isJoi || (validate.validate && typeof validate.validate === 'function')) {
          const toValidate = {
            body: req.body,
            query: req.query,
            params: req.params,
          };
          const { error, value } = validate.validate(toValidate, { abortEarly: false, stripUnknown: true });
          if (error) {
            const firstErr = error.details?.[0];
            return next(
              new ValidationError(firstErr?.message || 'بيانات الإدخال غير صالحة', {
                field: firstErr?.path?.join('.') || null,
                details: error.details,
              })
            );
          }
          if (value.body) req.body = value.body;
          if (value.query) req.query = value.query;
          if (value.params) req.params = value.params;
        }
        return next();
      } catch (valErr) {
        return next(valErr);
      }
    });
  }

  // Sanitize masked input from writes
  pipeline.push((req, res, next) => {
    if (['post', 'patch', 'put'].includes(httpMethod) && req.body) {
      req.body = sanitizeMaskedInput(req.body);
    }
    return next();
  });

  // ─── 3. Final Handler Wrapper with Masking & Envelope ──────────────────────
  pipeline.push(async (req, res) => {
    try {
      const result = await handler(req, res);
      // If the handler already sent the response (e.g. streaming, file download), stop
      if (res.headersSent) return;

      const rawData = result?.data !== undefined ? result.data : result;
      const extraMeta = result?.meta || {};
      const statusCode = result?.statusCode || (httpMethod === 'post' ? 201 : 200);

      // Apply field-level masking
      const { maskedData, maskedFields } = maskSensitiveFields(rawData, req.authContext.permissions);

      return sendSuccess(res, {
        data: maskedData,
        meta: {
          ...extraMeta,
          scopeApplied: req.authContext.effectiveScope,
          maskedFields: maskedFields.length > 0 ? maskedFields : undefined,
        },
        statusCode,
      });
    } catch (err) {
      return sendError(res, err);
    }
  });

  // Mount on router
  router[httpMethod](path, ...pipeline);
}

module.exports = {
  defineEndpoint,
};
