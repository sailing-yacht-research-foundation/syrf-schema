const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class UserNotification extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'userId',
    });
  }
}

module.exports = (sequelize) => {
  UserNotification.init(
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
      notificationType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      notificationTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      notificationMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      modelName: 'UserNotification',
      sequelize,
      timestamps: false,
    },
  );
  return UserNotification;
};
