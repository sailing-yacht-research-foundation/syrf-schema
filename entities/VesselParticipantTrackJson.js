const { DataTypes, Model } = require('sequelize');

class VesselParticipantTrackJson extends Model {}

module.exports = (sequelize) => {
  VesselParticipantTrackJson.init(
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
      providedStorageKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      calculatedStorageKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      simplifiedStorageKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: 'VesselParticipantTrackJson',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantTrackJson;
};
