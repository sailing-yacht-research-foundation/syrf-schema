const competitionUnitStatus = {
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
};

const userSignupType = {
  UNREGISTERED: 'unregistered',
  REGISTERED: 'registered',
};

const conversionValues = {
  milesToMeters: 1609.344,
  nauticalMilesToMeters: 1852,
};

const geometryType = {
  POLYLINE: 'Polyline', // Not a valid geometry type to be deprecated
  POINT: 'Point',
  POLYGON: 'Polygon',
  LINESTRING: 'LineString',
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
  UNAUTHORIZED_DATA_READ: 'E014', //unauthorized data read
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

const searchIndex = {
  CALENDAR_EVENTS: 'races',
};

const raceSetupType = {
  START: 'START',
  STOP: 'STOP',
  COMPETITION_UNIT_SYNC: 'COMPETITION_UNIT_SYNC',
  RESETUP: 'RESETUP',
};

const openCompetitionConfig = {
  defaultDistance: 1, // in miles
};

const defaultKMLOptions = {
  lineColor: 'B0E0E659',
  lineWidth: 6,
  scale: 1,
  heading: 0,
};

const groupVisibilities = {
  public: 'PUBLIC',
  private: 'PRIVATE',
  moderated: 'MODERATED',
};

const groupMemberStatus = {
  invited: 'INVITED',
  requested: 'REQUESTED',
  accepted: 'ACCEPTED',
  declined: 'DECLINED',
};

const groupTypes = {
  organization: 'ORGANIZATION',
  committee: 'COMMITTEE',
  team: 'TEAM',
};

const miscOptionsValue = {
  staleInvitationDuration: -2, // in days
};

const bullQueues = {
  raceStart: 'race_start',
  expeditionSubsExpiration: 'expedition_subs_expiration',
  openGraph: 'open_graph',
  closestCity: 'closest_city',
  yachtScoringTestCredentials: 'yachtscoring_test_credentials',
  courseEdit: 'course_edit',
  participantEdit: 'participant_edit',
};

const externalServiceSources = {
  yachtscoring: 'YACHTSCORING',
};

const redisKeyPrefixes = {
  LIVE_VIEWERS: 'live-viewers-',
  EXPEDITION_PING: 'expedition_ping-',
  DEV_TOKEN: 'devtoken-',
  PHONE_VERIFY_CODE: 'phone_verify_code_',
  PHONE_VERIFY_LOCK: 'phone_verify_lock_',
  PHONE_VERIFY_ATTEMP: 'phone_verify_attempt_',
};

const vesselEvents = {
  rounding: 'VesselPointRounding',
  insideCrossing: 'VesselLineInsideCrossing',
  outsideCrossing: 'VesselLineOutsideCrossing',
  polygonEnter: 'VesselPolygonEntered',
  polygonExit: 'VesselPolygonExited',
};

const boatSides = {
  PORT: 'port', // left side of vessel
  STARBOARD: 'starboard', // right side of vessel
};

const expeditionBoatSides = {
  PORT: 'P', // left side of vessel
  STARBOARD: 'S', // right side of vessel
};

const participantEditTypes = {
  VESSEL_PARTICIPANT_ADDED: 'vessel-participant-added',
  VESSEL_PARTICIPANT_REMOVED: 'vessel-participant-removed',
  CREW_ADDED: 'crew-added',
  CREW_REMOVED: 'crew-removed',
  NEW_PARTICIPANT_JOINED: 'new-participant-joined', // this is for new participant joined open regatta using /open-competitions/:id/join
};

module.exports = {
  competitionUnitStatus,
  userSignupType,
  conversionValues,
  geometryType,
  errorCodes,
  statusCodes,
  searchIndex,
  raceSetupType,
  openCompetitionConfig,
  defaultKMLOptions,
  groupVisibilities,
  groupMemberStatus,
  groupTypes,
  miscOptionsValue,
  bullQueues,
  redisKeyPrefixes,
  externalServiceSources,
  vesselEvents,
  boatSides,
  expeditionBoatSides,
  participantEditTypes,
};
