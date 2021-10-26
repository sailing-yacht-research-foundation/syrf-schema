const { DataTypes, Model } = require('sequelize');

class VesselParticipantLeg extends Model {}

module.exports = (sequelize) => {
  VesselParticipantLeg.init(
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
      legId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      stopTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      averageCourseDerivedTWA: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      averageCourseTWA: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      legDistance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      elapsedTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      startPoint: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
      },
      endPoint: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
      },
      traveledDistance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: 'VesselParticipantLeg',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantLeg;
};
