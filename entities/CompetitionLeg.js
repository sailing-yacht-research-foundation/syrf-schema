const { DataTypes } = require('sequelize');

class CompetitionLeg extends Model {}

module.exports = (sequelize) => {
  CompetitionLeg.init(
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
      startMarkId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      endMarkId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      modelName: 'CompetitionLeg',
      sequelize,
      timestamps: false,
    },
  );
  return CompetitionLeg;
};
