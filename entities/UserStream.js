const { DataTypes } = require('sequelize');
const { ivsLatencyMode, ivsTypeEnum } = require('../enums');
const ModelBase = require('../ModelBase');

class UserStream extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'userId',
    });
    this.belongsTo(models.CompetitionUnit, {
      as: 'competition',
      constraints: false,
      foreignKey: 'competitionUnitId',
    });
  }
}

module.exports = (sequelize) => {
  UserStream.init(
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
      isLive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: false,
      },
      competitionUnitId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      ivsChannelArn: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ivsChannelName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ivsIngestEndpoint: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ivsPlaybackUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      streamKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      streamKeyArn: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      privateStream: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: false,
      },
      latencyMode: {
        type: DataTypes.ENUM(Object.values(ivsLatencyMode)),
        allowNull: false,
        defaultValue: ivsLatencyMode.LOW,
      },
      ivsType: {
        type: DataTypes.ENUM(Object.values(ivsTypeEnum)),
        allowNull: false,
        defaultValue: ivsTypeEnum.STANDARD,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: 'UserStream',
      sequelize,
    },
  );
  return UserStream;
};
