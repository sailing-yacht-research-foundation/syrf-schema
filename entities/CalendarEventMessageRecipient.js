const { DataTypes } = require('sequelize');

const ModelBase = require('../ModelBase');

class CalendarEventMessageRecipient extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.CalendarEventMessage, {
      as: 'message',
      constraints: false,
      foreignKey: 'messageId',
    });
    this.belongsTo(models.UserProfile, {
      as: 'recipient',
      constraints: false,
      foreignKey: 'recipientId',
    });
  }
}

module.exports = (sequelize) => {
  CalendarEventMessageRecipient.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      messageId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      recipientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      modelName: 'CalendarEventMessageRecipient',
      sequelize,
      timestamps: false,
    },
  );
  return CalendarEventMessageRecipient;
};
