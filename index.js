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
db.Participant = require('./entities/Participant')(sequelize);
db.Vessel = require('./entities/Vessel')(sequelize);
db.VesselParticipant = require('./entities/VesselParticipant')(sequelize);
db.VesselParticipantCrew = require('./entities/VesselParticipantCrew')(
  sequelize,
);
db.VesselParticipantGroup = require('./entities/VesselParticipantGroup')(
  sequelize,
);
db.CalenderEvent = require('./entities/CalendarEvent')(sequelize);
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
db.VesselParticipantCrewTrack =
  require('./entities/VesselParticipantCrewTrack')(sequelize);
db.VesselParticipantCrewTrackJson =
  require('./entities/VesselParticipantCrewTrackJson')(sequelize);
db.TrackHistory = require('./entities/TrackHistory')(sequelize);

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

module.exports = db;
