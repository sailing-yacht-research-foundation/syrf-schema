const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class CalendarEvent extends ModelBase {
  static associate(models) {
    this.hasMany(models.CompetitionUnit, {
      as: 'competitionUnit',
      foreignKey: 'calendarEventId',
      constraints: false,
    });

    this.belongsToMany(models.UserProfile, {
      through: 'CalendarEditors',
      as: 'editors',
      constraints: false,
    });

    this.belongsTo(models.UserProfile, {
      as: 'owner',
      foreignKey: 'ownerId',
      constraints: false,
    });

    this.hasMany(models.Participant, {
      as: 'participants',
      foreignKey: 'calendarEventId',
      constraints: false,
    });

    this.hasMany(models.VesselParticipantGroup, {
      as: 'groups',
      foreignKey: 'calendarEventId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  CalendarEvent.init(
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
      locationName: {
        type: DataTypes.STRING,
      },
      location: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      externalUrl: {
        type: DataTypes.STRING,
      },
      startDay: {
        type: DataTypes.INTEGER,
      },
      startMonth: {
        type: DataTypes.INTEGER,
      },
      startYear: {
        type: DataTypes.INTEGER,
      },
      approximateStartTime: {
        type: DataTypes.DATE,
      },
      approximateStartTime_utc: {
        type: DataTypes.DATE,
      },
      approximateStartTime_zone: {
        type: DataTypes.STRING,
      },
      approximateEndTime: {
        type: DataTypes.DATE,
      },
      approximateEndTime_utc: {
        type: DataTypes.DATE,
      },
      approximateEndTime_zone: {
        type: DataTypes.STRING,
      },
      endDay: {
        type: DataTypes.INTEGER,
      },
      endMonth: {
        type: DataTypes.INTEGER,
      },
      endYear: {
        type: DataTypes.INTEGER,
      },
      ics: {
        type: DataTypes.STRING,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
      },
      description: {
        type: DataTypes.STRING(1000),
      },
      country: {
        type: DataTypes.STRING,
      },
      city: {
        type: DataTypes.STRING,
      },
      openGraphImage: {
        type: DataTypes.STRING,
      },
      isOpen: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      modelName: 'CalendarEvent',
      sequelize,
    },
  );
  return CalendarEvent;
};
