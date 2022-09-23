const { DataTypes } = require('sequelize');
const { competitionUnitStatus } = require('../enums');
const ModelBase = require('../ModelBase');

class CompetitionUnit extends ModelBase {
  static associate(models) {
    this.belongsTo(models.CalendarEvent, {
      as: 'calendarEvent',
      foreignKey: 'calendarEventId',
      constraints: false,
    });
    this.belongsTo(models.Course, {
      as: 'course',
      foreignKey: 'courseId',
      constraints: false,
    });
    this.belongsTo(models.VesselParticipantGroup, {
      as: 'vesselParticipantGroup',
      foreignKey: 'vesselParticipantGroupId',
      constraints: false,
    });
    this.belongsTo(models.VesselParticipantGroup, {
      as: 'group',
      foreignKey: 'vesselParticipantGroupId',
      constraints: false,
    });

    this.hasMany(models.TrackHistory, {
      as: 'tracks',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
    this.hasMany(models.VesselParticipantCrewTrackJson, {
      as: 'trackJsons',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
    this.hasMany(models.VesselParticipantTrackJson, {
      as: 'vpTrackJsons',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
    this.hasMany(models.UserStream, {
      as: 'streams',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
    this.hasMany(models.SlicedWeather, {
      as: 'slicedWeathers',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
    this.hasMany(models.SkippedCompetitionWeather, {
      as: 'skippedWeathers',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  CompetitionUnit.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      startTime: {
        type: DataTypes.DATE,
      },
      endTime: {
        type: DataTypes.DATE,
      },
      approximateStart: {
        type: DataTypes.DATE,
      },
      approximateStart_utc: {
        type: DataTypes.DATE,
      },
      approximateStart_zone: {
        type: DataTypes.STRING,
      },
      timeLimit: {
        type: DataTypes.DATE,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
      },
      isSavedByEngine: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment:
          'Flag to check if competition has been run and saved by Analysis Engine',
      },
      boundingBox: {
        type: DataTypes.GEOMETRY('POLYGON', 4326),
      },
      courseId: {
        type: DataTypes.UUID,
      },
      calendarEventId: {
        type: DataTypes.UUID,
      },
      vesselParticipantGroupId: {
        type: DataTypes.UUID,
      },
      description: {
        type: DataTypes.TEXT,
      },
      approximateStartLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      approximateEndLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      country: {
        type: DataTypes.STRING,
      },
      city: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: competitionUnitStatus.SCHEDULED,
      },
      openGraphImage: {
        type: DataTypes.STRING,
      },
      scrapedOriginalId: {
        type: DataTypes.STRING,
      },
      scrapedUrl: {
        type: DataTypes.STRING,
      },
      handicap: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      failedSetupCount: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
        comment:
          'How many times analysis engine start this competition but crashes in the middle',
      },
    },
    {
      modelName: 'CompetitionUnit',
      sequelize,
    },
  );
  return CompetitionUnit;
};
