const db = require('../models');

const BaseError = require('./BaseError');
const AuthError = require('./AuthError');
const ValidationError = require('./ValidationError');
const { Transaction } = require('sequelize');

exports.includeMeta = [
  {
    model: db.UserProfile,
    as: 'createdBy',
    attributes: ['id', 'name'],
  },
  {
    model: db.UserProfile,
    as: 'updatedBy',
    attributes: ['id', 'name'],
  },
];

exports.ValidationError = ValidationError;

exports.statusCodes = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTI_STATUS: 207,
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  MOVED_TEMPORARILY: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  TEMPORARY_REDIRECT: 307,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  REQUEST_ENTITY_TOO_LARGE: 413,
  REQUEST_URI_TOO_LARGE: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  REQUESTED_RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  UNORDERED_COLLECTION: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIME_OUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  BANDWIDTH_LIMIT_EXCEEDED: 509,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
};

exports.BaseError = BaseError;
exports.AuthError = AuthError;

exports.setCreateMeta = (data = {}, user) => {
  const now = Date.now();

  data.createdById = user?.id;
  data.developerId = user?.developerId;
  data.createdAt = now;

  return data;
};

exports.setUpdateMeta = (data = {}, user) => {
  const now = Date.now();

  data.updatedById = user?.id;
  data.updatedAt = now;

  return data;
};

exports.getMeta = ({ updatedById, updatedAt, createdById, createdAt } = {}) => {
  return {
    updatedById,
    updatedAt,
    createdById,
    createdAt,
  };
};

exports.useTransaction =
  (fc) =>
  async (...args) => {
    if (args.length > 0 && args[args.length - 1] instanceof Transaction) {
      return await fc(...args);
    } else {
      const tran = await db.sequelize.transaction();
      try {
        const result = await fc(...[...args, tran]);
        await tran.commit();
        return result;
      } catch (error) {
        await tran.rollback();
        throw error;
      }
    }
  };
