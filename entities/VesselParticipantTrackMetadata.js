const { DataTypes, Model } = require('sequelize');

class VesselParticipantTrackMetadata extends Model {}

module.exports = (sequelize) => {
  VesselParticipantTrackMetadata.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      trackId: {
        type: DataTypes.UUID,
        comment:
          'uuid to vesselParticipantTrackJsons, nullable, should be updated upon saving Competition data on AE',
      },
      competitionUnitId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      vesselParticipantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      elapsedTime: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      timeRankInCompetition: {
        type: DataTypes.INTEGER,
      },
      totalTraveledDistance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      ttdRankInCompetition: {
        type: DataTypes.INTEGER,
      },
      // SOG
      worstSog: {
        type: DataTypes.DOUBLE,
      },
      worstSogLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      avgSog: {
        type: DataTypes.DOUBLE,
      },
      bestSog: {
        type: DataTypes.DOUBLE,
      },
      bestSogLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      sogRankInCompetition: {
        type: DataTypes.INTEGER,
      },
      // VMG
      worstVmg: {
        type: DataTypes.DOUBLE,
      },
      worstVmgLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      avgVmg: {
        type: DataTypes.DOUBLE,
      },
      bestVmg: {
        type: DataTypes.DOUBLE,
      },
      bestVmgLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      vmgRankInCompetition: {
        type: DataTypes.INTEGER,
      },
      // VMC
      worstVmc: {
        type: DataTypes.DOUBLE,
      },
      worstVmcLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      avgVmc: {
        type: DataTypes.DOUBLE,
      },
      bestVmc: {
        type: DataTypes.DOUBLE,
      },
      bestVmcLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      vmcRankInCompetition: {
        type: DataTypes.INTEGER,
      },
    },
    {
      modelName: 'VesselParticipantTrackMetadata',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantTrackMetadata;
};
