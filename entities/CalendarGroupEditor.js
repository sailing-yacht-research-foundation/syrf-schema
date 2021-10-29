const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class CalendarGroupEditor extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.CalenderEvent, {
      as: 'calendarEvent',
      constraints: false,
      foreignKey: 'calendarEventId',
    });
    this.belongsTo(models.Group, {
      as: 'group',
      constraints: false,
      foreignKey: 'groupId',
    });
  }
}

module.exports = (sequelize) => {
  CalendarGroupEditor.init(
    {
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      calendarEventId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      modelName: 'CalendarGroupEditor',
      sequelize,
    },
  );
  return CalendarGroupEditor;
};
