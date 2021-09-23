const { DataTypes, Model } = require('sequelize');

class VesselParticipantTrack extends Model {}

module.exports = (sequelize) => {
  VesselParticipantTrack.init(
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
      position: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
      },
      pingTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      cog: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        comment: 'Heading of the vessel',
      },
      sog: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        comment: 'Speed of the vessel',
      },
      twa: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        comment: 'True wind Angle',
      },
      derivedCOG: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      derivedSOG: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      derivedTWA: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      windSpeed: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      windDirection: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
    },
    {
      modelName: 'VesselParticipantTrack',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantTrack;
};
