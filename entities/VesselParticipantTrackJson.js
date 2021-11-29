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
      totalTraveledDistance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      firstPosition: {
        type: DataTypes.GEOMETRY('POINT', 4326),
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
