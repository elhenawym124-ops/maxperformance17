'use strict';

/**
 * @module v2/core/responseEnvelope
 * @description Standard response envelope formatting for /api/v2
 * {
 *   success: boolean,
 *   data: object | array | null,
 *   meta: { requestId, timestamp, apiVersion, pagination?, maskedFields?, ... },
 *   errors: [ { code, subCode, message, field, details } ]
 * }
 */

const { ApiError } = require('./errors');

function formatMeta(req, extraMeta = {}) {
  return {
    requestId: req.requestId || req.headers['x-request-id'] || `req_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    apiVersion: 'v2',
    ...extraMeta,
  };
}

function sendSuccess(res, { data = null, meta = {}, statusCode = 200 } = {}) {
  const req = res.req;
  const envelope = {
    success: true,
    data,
    meta: formatMeta(req, meta),
    errors: [],
  };
  return res.status(statusCode).json(envelope);
}

function sendError(res, error, { meta = {} } = {}) {
  const req = res.req;
  let statusCode = 500;
  let errorObj = {
    code: 'INTERNAL_ERROR',
    subCode: 'SERVER_ERROR',
    message: 'حدث خطأ غير متوقع في الخادم',
    field: null,
    details: null,
  };

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    errorObj = error.toJSON();
  } else if (error && error.statusCode) {
    statusCode = error.statusCode;
    errorObj = {
      code: error.code || 'REQUEST_FAILED',
      subCode: error.subCode || null,
      message: error.message || 'فشلت معالجة الطلب',
      field: error.field || null,
      details: error.details || null,
    };
  } else if (error && error.name === 'ValidationError') {
    // Joi or express-validator
    statusCode = 422;
    errorObj = {
      code: 'VALIDATION_ERROR',
      subCode: 'INVALID_INPUT',
      message: error.message || 'بيانات الإدخال غير صالحة',
      field: error.details?.[0]?.path?.[0] || null,
      details: error.details || null,
    };
  }

  const envelope = {
    success: false,
    data: null,
    meta: formatMeta(req, meta),
    errors: [errorObj],
  };

  return res.status(statusCode).json(envelope);
}

module.exports = {
  formatMeta,
  sendSuccess,
  sendError,
};
