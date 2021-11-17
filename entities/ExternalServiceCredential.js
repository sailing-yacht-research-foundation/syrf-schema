const { DataTypes } = require('sequelize');
const { externalServiceSources } = require('../enums');
const ModelBase = require('../ModelBase');

class ExternalServiceCredential extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'userProfileId',
    });
  }
}

module.exports = (sequelize) => {
  ExternalServiceCredential.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      userProfileId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
      },
      source: {
        type: Sequelize.DataTypes.ENUM(Object.values(externalServiceSources)),
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: 'ExternalServiceCredential',
      sequelize,
    },
  );
  return ExternalServiceCredential;
};
