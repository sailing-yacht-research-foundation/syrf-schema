const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class CalendarGroupEditor extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.CalendarEvent, {
      as: 'calendarEvent',
      constraints: false,
      foreignKey: 'calendarEventId',
    });
    this.belongsTo(models.Participant, {
      as: 'participant',
      constraints: false,
      foreignKey: 'participantId',
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
