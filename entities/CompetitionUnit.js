const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class CompetitionUnit extends ModelBase {
  static associate(models) {
    this.belongsTo(models.CalenderEvent, {
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
      foreignKey: 'userProfileId',
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
        type: DataTypes.STRING(1000),
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
    },
    {
      modelName: 'CompetitionUnit',
      sequelize,
    },
  );
  return CompetitionUnit;
};
