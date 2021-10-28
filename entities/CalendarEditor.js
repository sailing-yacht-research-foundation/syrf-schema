const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class CalendarEditor extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.CalenderEvent, {
      as: 'calendarEvent',
      constraints: false,
      foreignKey: 'CalendarEventId',
    });
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'UserProfileId',
    });
  }
}

module.exports = (sequelize) => {
  CalendarEditor.init(
    {
      UserProfileId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      CalendarEventId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      modelName: 'CalendarEditor',
      sequelize,
    },
  );
  return CalendarEditor;
};
