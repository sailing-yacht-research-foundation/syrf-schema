const competitionUnitStatus = {
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  POSTPONED: 'POSTPONED',
  CANCELED: 'CANCELED',
};

const calendarEventStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  CANCELED: 'CANCELED',
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
  TRACKS: 'TRACKS',
  COMPETITION_UNIT_SYNC: 'COMPETITION_UNIT_SYNC',
  RESETUP: 'RESETUP',
  STOP_TRACKING: 'STOP_TRACKING',
  POSTPONE: 'POSTPONE',
  RESCHEDULE: 'RESCHEDULE',
  START_TIME_UPDATE: 'START_TIME_UPDATE',
  REQUEST_LIVE_OCS_STATUS: 'REQUEST_LIVE_OCS_STATUS',
  LOG: 'LOG',
  DISCARD: 'DISCARD',
};

const ocsStatuses = {
  UNKNOWN: 'Unknown / before the start',
  OCS: 'OCS',
  nonOCS: 'non-OCS',
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
  blocked: 'BLOCKED',
};

const followerStatus = {
  accepted: 'ACCEPTED',
  requested: 'REQUESTED',
  blocked: 'BLOCKED',
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
  expeditionSubsExpiration: 'expedition_stream_expiration',
  openGraph: 'open_graph',
  closestCity: 'closest_city',
  yachtScoringTestCredentials: 'yachtscoring_test_credentials',
  importingEvents: 'importing_events',
  courseEdit: 'course_edit',
  participantEdit: 'participant_edit',
  eventStop: 'event_stop',
  importTrack: 'import_track',
  calculateImport: 'calculate_import_track',
  recalculateTrack: 'recalculate_track',
  raceUpdate: 'race_update',
  notification: 'notification',
  clearUntrackedRaces: 'clear_untracked_races',
  warningUntrackedEvents: 'warning_untracked_events',
  cleanupESDangling: 'cleanup_es_dangling',
  slicerQueue: 'slicer_queue',
  era5Queue: 'era5_download_queue',
  createThumbnail: 'create_thumbnail',
};

const externalServiceSources = {
  yachtscoring: 'YACHTSCORING',
};

const validYachtScoringJobType = {
  testCredentials: 'test-credentials',
  getEvents: 'get-events',
  importEventData: 'import-event-data',
};

const redisKeyPrefixes = {
  LIVE_VIEWERS: 'live-viewers-',
  EXPEDITION_PING: 'expedition_ping-',
  DEV_TOKEN: 'devtoken-',
  PHONE_VERIFY_CODE: 'phone_verify_code_',
  PHONE_VERIFY_LOCK: 'phone_verify_lock_',
  PHONE_VERIFY_ATTEMPT: 'phone_verify_attempt_',
  VESSEL_SATELLITE_VERIFY_CODE: 'vessel_satellite_verify_code_',
  VESSEL_SATELLITE_VERIFY_LOCK: 'vessel_satellite_verify_lock_',
  VESSEL_SATELLITE_VERIFY_ATTEMPT: 'vessel_satellite_verify_attempt_',
  VESSEL_ONBOARD_PHONE_VERIFY_CODE: 'vessel_onboard_phone_verify_code_',
  VESSEL_ONBOARD_PHONE_VERIFY_LOCK: 'vessel_onboard_phone_verify_lock_',
  VESSEL_ONBOARD_PHONE_VERIFY_ATTEMPT: 'vessel_onboard_phone_verify_attempt_',
  RUNNING_SIMULATION: 'running_simulation_',
  CU_LAST_STATE: 'lastknown:',
};

const vesselEvents = {
  rounding: 'VesselPointRounding',
  insideCrossing: 'VesselLineInsideCrossing',
  outsideCrossing: 'VesselLineOutsideCrossing',
  polygonEnter: 'VesselPolygonEntered',
  polygonExit: 'VesselPolygonExited',
  ocs: 'VesselOCS',
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

const redisCacheKeys = {
  LATEST_EULA_VERSION: 'eula_version',
  LATEST_PP_VERSION: 'pp_version',
};

const ivsLatencyMode = {
  NORMAL: 'NORMAL',
  LOW: 'LOW',
};
const ivsTypeEnum = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
};

const participantInvitationStatus = {
  INVITED: 'INVITED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  SELF_REGISTERED: 'SELF_REGISTERED',
  BLOCKED: 'BLOCKED',
};

const stripeInterval = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

const stripeSubscriptionStatus = {
  INCOMPLETE: 'incomplete',
  EXPIRED: 'incomplete_expired',
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PASTDUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
};

const stripePaymentStatus = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  NOTREQUIRED: 'no_payment_required',
};

const stripeCheckoutMode = {
  PAYMENT: 'payment',
  SETUP: 'setup',
  SUBSCRIPTION: 'subscription',
};

const stripeCheckoutStatus = {
  COMPLETE: 'complete',
  OPEN: 'open',
  EXPIRED: 'expired',
};

const stripeInvoiceStatus = {
  DRAFT: 'draft',
  PAID: 'paid',
  OPEN: 'open',
  UNCOLLECTIBLE: 'uncollectible',
  VOID: 'void',
};

const stripeAccountUpdateType = {
  onboarding: 'account_onboarding',
  update: 'account_update',
};

const stripePaymentMethods = {
  acssDebit: 'acss_debit',
  auBecsDebit: 'au_becs_debit',
  bancontact: 'bancontact',
  card: 'card',
  cardPresent: 'card_present',
  eps: 'eps',
  giropay: 'giropay',
  ideal: 'ideal',
  p24: 'p24',
  sepaDebit: 'sepa_debit',
  sofort: 'sofort',
};

const stripeSetupIntentStatus = {
  requiresPaymentMethod: 'requires_payment_method',
  requiresConfirmation: 'requires_confirmation',
  requiresAction: 'requires_action',
  processing: 'processing',
  canceled: 'canceled',
  succeeded: 'succeeded',
};

const vesselTypeEnums = {
  FOILBOARD: 'FOIL_BOARD',
  BOARD: 'BOARD',
  DINGHY: 'DINGHY',
  KEELBOAT: 'KEELBOAT',
  OTHER: 'OTHER',
};

const lifeRaftOwnership = {
  OWNED: 'OWNED',
  RENTED: 'RENTED',
};

const eventTypeEnums = {
  ONEDESIGN: 'ONE_DESIGN',
  HANDICAP: 'HANDICAP_RACE',
  KITESURFING: 'KITESURFING',
  WINGING: 'WINGING',
  WINDSURFING: 'WINDSURFING',
  CRUISING: 'CRUISING',
  RALLY: 'RALLY',
  TRAINING: 'TRAINING',
  OTHER: 'OTHER',
};

const participatingFeeTypes = {
  PERSON: 'PERSON',
  VESSEL: 'VESSEL',
};

const dataSources = {
  SYRF: 'SYRF',
  IMPORT: 'IMPORT',
  // Scrapers
  BLUEWATER: 'BLUEWATER',
  ESTELA: 'ESTELA',
  GEORACING: 'GEORACING',
  GEOVOILE: 'GEOVOILE',
  ISAIL: 'ISAIL',
  KATTACK: 'KATTACK',
  KWINDOO: 'KWINDOO',
  METASAIL: 'METASAIL',
  RACEQS: 'RACEQS',
  TACKTRACKER: 'TACKTRACKER',
  TRACTRAC: 'TRACTRAC',
  YACHTBOT: 'YACHTBOT',
  YELLOWBRICK: 'YELLOWBRICK',
  // 1-offs / non-automatable
  AMERICASCUP: 'AMERICASCUP',
  AMERICASCUP2021: 'AMERICASCUP2021',
  OLDGEOVOILE: 'OLDGEOVOILE',
  REGADATA: 'REGADATA',
  SAP: 'SAP',
  SWIFTSURE: 'SWIFTSURE',
};

const raceUpdateTypes = {
  ADDED: 'ADDED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  RACE_STARTED: 'RACE_STARTED',
};

const userRoles = {
  SUPERADMIN: 'SUPERADMIN',
};

const notificationTypes = {
  userAddedToGroupAdmin: 'USER_ADDED_TO_GROUP_ADMIN',
  userInvitedToGroup: 'USER_INVITED_TO_GROUP',
  userAddedToEventAdmin: 'USER_ADDED_TO_EVENT_ADMIN',
  userInvitedToPrivateRegatta: 'USER_INVITED_TO_PRIVATE_REGATTA',
  userNewFollower: 'USER_NEW_FOLLOWER',
  eventInactivityWarning: 'EVENT_INACTIVITY_WARNING',
  eventInactivityDeletion: 'EVENT_INACTIVITY_DELETION',
  requestedJoinGroup: 'REQUEST_JOIN_GROUP',
  userAchievedBadge: 'USER_ACHIEVE_BADGE',
  groupAchievedBadge: 'GROUP_ACHIEVE_BADGE',
  openEventNearbyCreated: 'OPEN_EVENT_NEARBY_CREATED',
  competitionStartingSoon: 'COMPETITION_START_TRACKING', // For when race start queue kick off analysis engine
  newCompetitionAddedToEvent: 'NEW_COMPETITION_ADDED_TO_EVENT',
  kudosReceived: 'KUDOS_RECEIVED',
  eventMessagesReceived: 'EVENT_MESSAGES_RECEIVED',
  simulationDeletion: 'SIMULATION_DELETION',
  newEventDocumentUploaded: 'NEW_EVENT_DOCUMENT_UPLOADED',
  newEventWaiverUploaded: 'NEW_EVENT_WAIVER_UPLOADED',
};

const mobileOnlyNotificationTypes = [
  'newCompetitionAddedToEvent',
  'competitionStartingSoon',
];

const generalNotificationTypes = [
  'userAddedToGroupAdmin',
  'userInvitedToGroup',
  'userAddedToEventAdmin',
  'userInvitedToPrivateRegatta',
  'userNewFollower',
  'eventInactivityWarning',
  'eventInactivityDeletion',
  'requestedJoinGroup',
  'userAchievedBadge',
  'groupAchievedBadge',
  'openEventNearbyCreated',
  'kudosReceived',
  'eventMessagesReceived',
  'simulationDeletion',
  'newEventDocumentUploaded',
  'newEventWaiverUploaded',
];

const kudosTypes = {
  thumbsUp: 'THUMBS_UP',
  applause: 'APPLAUSE',
  star: 'STAR',
  heart: 'HEART',
};

const geojsonProperties = {
  lat: 'lat',
  lon: 'lon',
  elevation: 'elevation',
  time: 'time',
  sog: 'sog',
  cog: 'cog',
  twa: 'twa',
  vmc: 'vmc',
  vmg: 'vmg',
  windSpeed: 'windSpeed',
  windDirection: 'windDirection',
  heading: 'heading',
  instrumentCOGTrueAccuracyDegrees: 'instrumentCOGTrueAccuracyDegrees',
  instrumentSOGAccuracyMetersPerSecond: 'instrumentSOGAccuracyMetersPerSecond',
  instrumentHorizontalAccuracyMeters: 'instrumentHorizontalAccuracyMeters',
  instrumentVerticalAccuracyMeters: 'instrumentVerticalAccuracyMeters',
};

const trackingEvent = {
  START_TRACKING: 'start_tracking',
  STOP_TRACKING: 'stop_tracking',
  DISCONNECTED: 'disconnected',
  START_MARK_TRACKING: 'start_mark_tracking',
  STOP_MARK_TRACKING: 'stop_mark_tracking',
  MARK_DISCONNECTED: 'mark_disconnected',
};

const waiverTypes = {
  noticeOfRace: 'noticeOfRacePDF',
  mediaWaiver: 'mediaWaiverPDF',
  discalimer: 'disclaimerPDF',
};

const liveDataGossipType = {
  SIMULATION_RESUME_REQUEST: 'SIMULATION_RESUME_REQUEST',
};

const slicedWeatherTypes = {
  GRIB: 'GRIB',
  JSON: 'JSON',
};

const weatherModels = {
  GFS: [
    'GFS',
    'GFS_025_CIN_SURFACE',
    'GFS_025_GUST_SURFACE',
    'GFS_025_PRES_SURFACE',
    'GFS_025_WIND_10M',
    'GFS_025_WIND_20M',
    'GFS_025_WIND_30M',
    'GFS_025_WIND_40M',
    'GFS_025_WIND_50M',
    'GFS_025_WIND_80M',
    'GFS_050_CIN_SURFACE',
    'GFS_050_GUST_SURFACE',
    'GFS_050_PRES_SURFACE',
    'GFS_050_WIND_10M',
    'GFS_050_WIND_20M',
    'GFS_050_WIND_30M',
    'GFS_050_WIND_50M',
    'GFS_050_WIND_80M',
  ],
  ERA5: [
    'ERA5_025_PRES_SFC',
    'ERA5_025_WIND_10M',
    'ERA5_500_COEFFICENT_DRAG_10M',
    'ERA5_500_DIRECTION_WIND_WAVES_SFC',
    'ERA5_500_MEAN_DIRECTION_TOTAL_SWELL_SFC',
    'ERA5_500_MEAN_PERIOD_TOTAL_SWELL_SFC',
    'ERA5_500_MWSPER_SFC',
    'ERA5_500_SIG_HEIGHT_TOTAL_SWELL_SFC',
    'ERA5_500_WAVE_SPECTRAL_DIRECTION_WIDTH_SFC',
    'ERA5_500_WAVE_SPECTRAL_DIRECTION_WIDTH_SWELL_SFC',
    'ERA5_500_WAVE_SPECTRAL_DIRECTION_WIDTH_WIND_WAVES_SFC',
    'ERA5_500_WVPER_SFC',
    'ERA5_500_WWSDIR_SFC',
  ],
  ECMWF: ['ECMWF_OPER'],
  HRRR_SUB_HOURLY: ['HRRR_SUB_HOURLY'],
  ARPEGE_WORLD: ['ARPEGE_WORLD'],
  ARPEGE_EUROPE: ['ARPEGE_EUROPE'],
  RTOFS_GLOBAL: ['RTOFS_GLOBAL'],
  RTOFS_FORECAST_WESTERN_CONUS: ['RTOFS_FORECAST_WESTERN_CONUS'],
  RTOFS_FORECAST_WESTERN_ATLANTIC: ['RTOFS_FORECAST_WESTERN_ATLANTIC'],
  AROME_FRANCE: ['AROME_FRANCE'],
  AROME_FRANCE_HD: ['AROME_FRANCE_HD'],
};

module.exports = {
  competitionUnitStatus,
  calendarEventStatus,
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
  followerStatus,
  groupTypes,
  miscOptionsValue,
  bullQueues,
  redisKeyPrefixes,
  externalServiceSources,
  validYachtScoringJobType,
  vesselEvents,
  boatSides,
  expeditionBoatSides,
  participantEditTypes,
  redisCacheKeys,
  ivsLatencyMode,
  ivsTypeEnum,
  participantInvitationStatus,
  stripeInterval,
  stripeSubscriptionStatus,
  stripePaymentStatus,
  stripeCheckoutMode,
  stripeCheckoutStatus,
  stripeInvoiceStatus,
  stripeAccountUpdateType,
  stripePaymentMethods,
  stripeSetupIntentStatus,
  vesselTypeEnums,
  lifeRaftOwnership,
  eventTypeEnums,
  participatingFeeTypes,
  dataSources,
  raceUpdateTypes,
  userRoles,
  notificationTypes,
  mobileOnlyNotificationTypes,
  generalNotificationTypes,
  geojsonProperties,
  kudosTypes,
  trackingEvent,
  ocsStatuses,
  waiverTypes,
  liveDataGossipType,
  slicedWeatherTypes,
  weatherModels,
};
