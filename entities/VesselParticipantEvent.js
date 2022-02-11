const { DataTypes, Model } = require('sequelize');

class VesselParticipantEvent extends Model {}

module.exports = (sequelize) => {
  VesselParticipantEvent.init(
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
      markId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      eventTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      eventCoordinate: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      isRecalculated: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
    },
    {
      modelName: 'VesselParticipantEvent',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantEvent;
};
