const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class SubscriptionTier extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.hasMany(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'subscriptionTier',
    });
  }
}

module.exports = (sequelize) => {
  SubscriptionTier.init(
    {
      tierCode: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      tierName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stripeProductId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: 'SubscriptionTier',
      sequelize,
    },
  );
  return SubscriptionTier;
};
