const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class ExpeditionSubscription extends ModelBase {
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'user',
      foreignKey: 'userProfileId',
      constraints: false,
    });

    this.belongsTo(models.CompetitionUnit, {
      as: 'competitionUnit',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  ExpeditionSubscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      replyPort: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: 'ExpeditionSubscription',
      sequelize,
    },
  );
  return ExpeditionSubscription;
};
