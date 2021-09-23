const { DataTypes, Model } = require('sequelize');

class CompetitionPointTrack extends Model {}

module.exports = (sequelize) => {
  CompetitionPointTrack.init(
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
      position: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
      },
      pingTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: 'CompetitionPointTrack',
      sequelize,
      timestamps: false,
    },
  );
  return CompetitionPointTrack;
};
