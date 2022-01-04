const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class ParticipationCharge extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'userId',
    });
    this.belongsTo(models.CalendarEvent, {
      as: 'calendarEvent',
      constraints: false,
      foreignKey: 'calendarEventId',
    });
  }
}

module.exports = (sequelize) => {
  ParticipationCharge.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      calendarEventId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      checkoutSessionId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expireDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      modelName: 'ParticipationCharge',
      sequelize,
    },
  );
  return ParticipationCharge;
};
