const { Model, DataTypes } = require('sequelize');

class SkippedSliceCompetition extends Model {}

module.exports = (sequelize) => {
  SkippedSliceCompetition.init(
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
      modelName: 'SkippedSliceCompetition',
      sequelize,
      timestamps: false,
    },
  );
  return SkippedSliceCompetition;
};
