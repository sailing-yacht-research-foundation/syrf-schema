const { DataTypes, Model } = require('sequelize');

class CompetitionUnitWind extends Model {}

module.exports = (sequelize) => {
  CompetitionUnitWind.init(
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
      startTime: {
        type: DataTypes.DATE,
      },
      endTime: {
        type: DataTypes.DATE,
      },
      areaPolygon: {
        type: DataTypes.GEOMETRY('POLYGON', 4326),
      },
      windDirection: {
        type: DataTypes.DOUBLE,
      },
      windSpeed: {
        type: DataTypes.DOUBLE,
      },
    },
    {
      modelName: 'CompetitionUnitWind',
      sequelize,
      timestamps: false,
    },
  );
  return CompetitionUnitWind;
};
