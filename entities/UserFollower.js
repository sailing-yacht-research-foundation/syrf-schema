const { DataTypes } = require('sequelize');
const { followerStatus } = require('../enums');
const ModelBase = require('../ModelBase');

class UserFollower extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'following',
      constraints: false,
      foreignKey: 'userId',
    });
    this.belongsTo(models.UserProfile, {
      as: 'follower',
      constraints: false,
      foreignKey: 'followerId',
    });
  }
}

module.exports = (sequelize) => {
  UserFollower.init(
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
      followerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(Object.values(followerStatus)),
        allowNull: false,
        defaultValue: followerStatus.requested,
      },
    },
    {
      modelName: 'UserFollower',
      sequelize,
    },
  );
  return UserFollower;
};
