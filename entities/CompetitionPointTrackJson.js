const { DataTypes, Model } = require('sequelize');

class CompetitionPointTrackJson extends Model {}

module.exports = (sequelize) => {
  CompetitionPointTrackJson.init(
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
      pointId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      storageKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: 'competitionPointTrackJson',
      sequelize,
      timestamps: false,
    },
  );
  return CompetitionPointTrackJson;
};
