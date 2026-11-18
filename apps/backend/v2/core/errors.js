'use strict';

/**
 * @module v2/core/errors
 * @description Standard error classes for /api/v2 enforcing consistent JSON structure
 */

class ApiError extends Error {
  constructor({
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    subCode = null,
    message = 'حدث خطأ غير متوقع في الخادم',
    field = null,
    details = null,
  } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.subCode = subCode;
    this.field = field;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      subCode: this.subCode,
      message: this.message,
      field: this.field,
      details: this.details,
    };
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'جلسة غير مصرح بها أو انتهت صلاحيتها', { subCode = 'INVALID_OR_MISSING_TOKEN', details = null } = {}) {
    super({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      subCode,
      message,
      details,
    });
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'ليس لديك الصلاحية المطلوبة لتنفيذ هذا الإجراء', { subCode = 'MISSING_PERMISSION', requiredPermission = null, scope = null, details = null } = {}) {
    super({
      statusCode: 403,
      code: 'FORBIDDEN',
      subCode,
      message,
      details: details || (requiredPermission ? { requiredPermission, scope } : null),
    });
  }
}

class NotFoundError extends ApiError {
  constructor(resourceName = 'المورد', identifier = null) {
    super({
      statusCode: 404,
      code: 'NOT_FOUND',
      subCode: 'RESOURCE_NOT_FOUND',
      message: `${resourceName} غير موجود أو لا ينتمي لشركتك`,
      details: identifier ? { identifier } : null,
    });
  }
}

class ValidationError extends ApiError {
  constructor(message = 'بيانات الإدخال غير صالحة', { field = null, details = null } = {}) {
    super({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      subCode: 'INVALID_INPUT',
      message,
      field,
      details,
    });
  }
}

class ConflictError extends ApiError {
  constructor(message = 'تعارض في حالة المورد أو تكرار مفتاح فريد', { subCode = 'STATE_CONFLICT', details = null } = {}) {
    super({
      statusCode: 409,
      code: 'CONFLICT',
      subCode,
      message,
      details,
    });
  }
}

class RateLimitedError extends ApiError {
  constructor(retryAfterSeconds = 60, message = 'تم تجاوز الحد الأقصى للطلبات المسموح بها') {
    super({
      statusCode: 429,
      code: 'RATE_LIMITED',
      subCode: 'QUOTA_EXCEEDED',
      message,
      details: { retryAfterSeconds },
    });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

class InternalError extends ApiError {
  constructor(message = 'حدث خطأ في معالجة الطلب', { subCode = 'UNEXPECTED_EXCEPTION', details = null } = {}) {
    super({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      subCode,
      message,
      details,
    });
  }
}

module.exports = {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitedError,
  InternalError,
};
