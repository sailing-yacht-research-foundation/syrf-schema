const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class UserSetting extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'id',
    });
  }
}

module.exports = (sequelize) => {
  UserSetting.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      emailNotificationSettings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      browserNotificationSettings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      mobileNotificationSettings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      persistentNotificationSettings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      modelName: 'UserSetting',
      sequelize,
      timestamps: false,
    },
  );
  return UserSetting;
};
