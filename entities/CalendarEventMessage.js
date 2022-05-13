const { DataTypes } = require('sequelize');

const ModelBase = require('../ModelBase');

class CalendarEventMessage extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'sender',
      constraints: false,
      foreignKey: 'senderId',
    });
    this.belongsTo(models.CalendarEvent, {
      as: 'event',
      constraints: false,
      foreignKey: 'calendarEventId',
    });
    this.hasMany(models.CalendarEventMessageRecipient, {
      as: 'recipients',
      foreignKey: 'messageId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  CalendarEventMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      calendarEventId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The admin that sent the message',
      },
      messageContent: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: 'CalendarEventMessage',
      sequelize,
      timestamps: false,
    },
  );
  return CalendarEventMessage;
};
