const { DataTypes } = require('sequelize');

const ModelBase = require('../ModelBase');

class SkippedCompetitionWeather extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.CompetitionUnit, {
      as: 'competitionUnit',
      constraints: false,
      foreignKey: 'competitionUnitId',
    });
  }
}

module.exports = (sequelize) => {
  SkippedCompetitionWeather.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      competitionUnitId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      totalFileCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      modelName: 'SkippedCompetitionWeather',
      sequelize,
      timestamps: false,
    },
  );
  return SkippedCompetitionWeather;
};
