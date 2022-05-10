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
        comment:
          'The original version of track data received (averaged if multi crewed)',
      },
      calculatedStorageKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment:
          'The calculated version of track data (averaged as well if multi crew)',
      },
      simplifiedStorageKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment:
          'The simplified version (reduced position count) for lightweight payload of track',
      },
      totalTraveledDistance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      firstPosition: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      locationUpdateCount: {
        type: DataTypes.INTEGER,
        comment:
          'The count of location updates received for this vessel track, should reflect the same value as geometry count of provided track geojson',
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
