const competitionUnitStatus = {
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
};

const conversionValues = {
  milesToMeters: 1609.344,
  nauticalMilesToMeters: 1852,
};

const geometryType = {
  POLYLINE: 'Polyline',
  POINT: 'Point',
  POLYGON: 'Polygon',
};

const errorCodes = {
  INTERNAL_SERVER_ERROR: 'E000', //internal server error
  TOKEN_EXPIRED: 'E001', //expired token
  INVALID_ACCESS_TOKEN: 'E002', //invalid access token
  INVALID_SESSION_TOKEN: 'E003', //invalid session token
  SESSION_NOT_FOUND: 'E004', //invalid session token
  DATA_NOT_FOUND: 'E005', //data not found
  UNAUTHORIZED_DATA_CHANGE: 'E006', //unauthorized data change
  DATA_VALIDATION_FAILED: 'E007', //data validation failed (ex: missing field, data already exists etc )
  INVALID_DEV_TOKEN: 'E007', // authenticate with invalid dev token
  UNAUTHORIZED_DEV_TOKEN: 'E008', // authenticate with invalid dev token
  USER_ALREADY_REGISTERED: 'E009', // register anonymous user failed because user already has a oauth profile
  OAUTH_PROFILE_ALREADY_REGISTERED: 'E010', // register anonymous user failed because oauth profile already registered to other profile
  REGISTERED_USER_ONLY: 'E011', // rejected access to user management, only registered user allowed to access user management
  INVALID_GRANT: 'E012', // invalid grant for password login
  INVALID_REFRESH_TOKEN: 'E013', //invalid refresh token
};

const statusCodes = {
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

module.exports = {
  competitionUnitStatus,
  conversionValues,
  geometryType,
  errorCodes,
  statusCodes
};