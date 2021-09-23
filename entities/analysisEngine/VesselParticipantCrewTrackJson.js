const { DataTypes, Model } = require('sequelize');

class VesselParticipantCrewTrackJson extends Model {}

module.exports = (sequelize) => {
  VesselParticipantCrewTrackJson.init(
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
      vesselParticipantCrewId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      storageKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: 'VesselParticipantCrewTrackJson',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantCrewTrackJson;
};
