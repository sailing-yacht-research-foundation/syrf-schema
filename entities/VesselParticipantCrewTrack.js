const { DataTypes, Model } = require('sequelize');

class VesselParticipantCrewTrack extends Model {}

module.exports = (sequelize) => {
  VesselParticipantCrewTrack.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      vesselParticipantCrewId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      competitionUnitId: {
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
      setDrift: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
    },
    {
      modelName: 'VesselParticipantCrewTrack',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantCrewTrack;
};
