const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class MarkTracker extends ModelBase {
  static associate(models) {
    this.belongsTo(models.CalendarEvent, {
      as: 'event',
      foreignKey: 'calendarEventId',
      constraints: false,
    });
    this.belongsTo(models.UserProfile, {
      as: 'user',
      foreignKey: 'userProfileId',
      constraints: false,
    });
    this.hasMany(models.CoursePoint, {
      as: 'points',
      foreignKey: 'markTrackerId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  MarkTracker.init(
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
      trackerUrl: {
        type: DataTypes.STRING,
      },
      calendarEventId: {
        type: DataTypes.UUID,
      },
    },
    {
      modelName: 'MarkTracker',
      sequelize,
    },
  );
  return MarkTracker;
};
