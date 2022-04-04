const { Sequelize, Op } = require('sequelize');
const ModelBase = require('./ModelBase');
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  },
);

const db = {};

db.UserProfile = require('./entities/UserProfile')(sequelize);
db.UserShareableInfo = require('./entities/UserShareableInfo')(sequelize);
db.Participant = require('./entities/Participant')(sequelize);
db.Vessel = require('./entities/Vessel')(sequelize);
db.VesselLifeRaft = require('./entities/VesselLifeRaft')(sequelize);
db.VesselParticipant = require('./entities/VesselParticipant')(sequelize);
db.VesselParticipantCrew = require('./entities/VesselParticipantCrew')(
  sequelize,
);
db.VesselParticipantGroup = require('./entities/VesselParticipantGroup')(
  sequelize,
);
db.VesselEditor = require('./entities/VesselEditor')(sequelize);
db.VesselGroupEditor = require('./entities/VesselGroupEditor')(sequelize);
db.CalendarEvent = require('./entities/CalendarEvent')(sequelize);
db.CompetitionUnit = require('./entities/CompetitionUnit')(sequelize);
db.Course = require('./entities/Course')(sequelize);
db.CourseSequencedGeometry = require('./entities/CourseSequencedGeometry')(
  sequelize,
);
db.CourseUnsequencedTimedGeometry =
  require('./entities/CourseUnsequencedTimedGeometry')(sequelize);
db.CourseUnsequencedUntimedGeometry =
  require('./entities/CourseUnsequencedUntimedGeometry')(sequelize);
db.Developer = require('./entities/Developer')(sequelize);
db.CompetitionResult = require('./entities/CompetitionResult')(sequelize);
db.VesselParticipantEvent = require('./entities/VesselParticipantEvent')(
  sequelize,
);
db.VesselParticipantLeg = require('./entities/VesselParticipantLeg')(sequelize);
db.VesselParticipantTrack = require('./entities/VesselParticipantTrack')(
  sequelize,
);
db.VesselParticipantTrackJson =
  require('./entities/VesselParticipantTrackJson')(sequelize);
db.VesselParticipantTrackMetadata =
  require('./entities/VesselParticipantTrackMetadata')(sequelize);
db.VesselParticipantCrewTrackJson =
  require('./entities/VesselParticipantCrewTrackJson')(sequelize);
db.TrackHistory = require('./entities/TrackHistory')(sequelize);
db.CoursePoint = require('./entities/CoursePoint')(sequelize);
db.MarkTracker = require('./entities/MarkTracker')(sequelize);
db.SlicedWeather = require('./entities/SlicedWeather')(sequelize);
db.CompetitionPointTrackJson = require('./entities/CompetitionPointTrackJson')(
  sequelize,
);

db.CompetitionLeg = require('./entities/CompetitionLeg')(sequelize);
db.CompetitionPointTrack = require('./entities/CompetitionPointTrack')(
  sequelize,
);
db.CompetitionUnitWind = require('./entities/CompetitionUnitWind')(sequelize);
db.ExpeditionSubscription = require('./entities/ExpeditionSubscription')(
  sequelize,
);

db.Group = require('./entities/Group')(sequelize);
db.GroupMember = require('./entities/GroupMember')(sequelize);
db.CalendarEditor = require('./entities/CalendarEditor')(sequelize);
db.CalendarGroupEditor = require('./entities/CalendarGroupEditor')(sequelize);
db.UserFollower = require('./entities/UserFollower')(sequelize);
db.UserStream = require('./entities/UserStream')(sequelize);

db.ScrapedFailedUrl = require('./entities/ScrapedFailedUrl')(sequelize);
db.ScrapedSuccessfulUrl = require('./entities/ScrapedSuccessfulUrl')(sequelize);

db.ExternalServiceCredential = require('./entities/ExternalServiceCredential')(
  sequelize,
);
db.SubscriptionTier = require('./entities/SubscriptionTier')(sequelize);
db.ParticipationCharge = require('./entities/ParticipationCharge')(sequelize);
db.UserNotification = require('./entities/UserNotification')(sequelize);
db.UserSetting = require('./entities/UserSetting')(sequelize);

for (const key in db) {
  if (Object.hasOwnProperty.call(db, key)) {
    if (db[key].prototype instanceof ModelBase) {
      db[key].associate(db);
      db[key].associateBase(db);
    }
  }
}

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

db.startDB = async () => {
  await sequelize.authenticate();
  console.log('db connected');
};

db.sync = async (force = false) => {
  await db.sequelize.sync({
    force: force,
  });
};
db.CalenderEvent = db.CalendarEvent; // Typo. Deprecated. Will be deleted once all reference to it has been removed

module.exports = db;
