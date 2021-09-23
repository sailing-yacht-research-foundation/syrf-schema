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
      lon: {
        type: DataTypes.FLOAT,
      },
      lat: {
        type: DataTypes.FLOAT,
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
      approximateEndTime: {
        type: DataTypes.DATE,
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
    },
    {
      modelName: 'CalendarEvent',
      sequelize,
    },
  );
  return CalendarEvent;
};
