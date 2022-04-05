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
      rankElapsedTime: {
        type: DataTypes.INTEGER,
      },
      totalTraveledDistance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      rankTotalTraveledDistance: {
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
      rankAvgSog: {
        type: DataTypes.INTEGER,
      },
      rankBestSog: {
        type: DataTypes.INTEGER,
      },
      rankWorstSog: {
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
      rankAvgVmg: {
        type: DataTypes.INTEGER,
      },
      rankBestVmg: {
        type: DataTypes.INTEGER,
      },
      rankWorstVmg: {
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
      rankAvgVmc: {
        type: DataTypes.INTEGER,
      },
      rankBestVmc: {
        type: DataTypes.INTEGER,
      },
      rankWorstVmc: {
        type: DataTypes.INTEGER,
      },
    },
    {
      // Note: Required to add tableName with plural here, somehow there's weird result with table name
      // when ending it with "metadata",  it doesn't convert to plural version on definition/load, but uses
      // plurals when transacting (destroy, create, etc). Tested by changing to metadate works fine, weird!
      tableName: 'VesselParticipantTrackMetadatas',
      modelName: 'VesselParticipantTrackMetadata',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantTrackMetadata;
};
