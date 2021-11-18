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
        type: DataTypes.UUID,
        allowNull: false,
      },
      source: {
        type: DataTypes.ENUM(Object.values(externalServiceSources)),
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['userProfileId', 'source', 'userId'],
        },
      ],
      modelName: 'ExternalServiceCredential',
      sequelize,
    },
  );
  return ExternalServiceCredential;
};
