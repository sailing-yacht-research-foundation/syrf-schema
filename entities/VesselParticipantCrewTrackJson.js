const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');
class VesselParticipantCrewTrackJson extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.VesselParticipantCrew, {
      as: 'crew',
      constraints: false,
      foreignKey: 'vesselParticipantCrewId',
    });
    this.belongsTo(models.CompetitionUnit, {
      as: 'competition',
      constraints: false,
      foreignKey: 'competitionUnitId',
    });
    this.belongsTo(models.TrackHistory, {
      as: 'trackHistory',
      foreignKey: 'vesselParticipantCrewId',
      targetKey: 'crewId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  VesselParticipantCrewTrackJson.init(
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
      storageKey: {
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
      modelName: 'VesselParticipantCrewTrackJson',
      sequelize,
      timestamps: false,
    },
  );
  return VesselParticipantCrewTrackJson;
};
