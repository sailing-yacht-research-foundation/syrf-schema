const { DataTypes, Model } = require('sequelize');

class CompetitionResult extends Model {}

module.exports = (sequelize) => {
  CompetitionResult.init(
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
      vesselParticipantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      finishTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      time: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: 'CompetitionResult',
      sequelize,
      timestamps: false,
    },
  );
  return CompetitionResult;
};
