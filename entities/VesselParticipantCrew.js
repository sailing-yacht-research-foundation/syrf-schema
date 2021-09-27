const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class VesselParticipantCrew extends ModelBase {
  static associate(models) {
    this.belongsTo(models.VesselParticipant, {
      as: 'vesselParticipant',
      constraints: false,
      foreignKey: 'vesselParticipantId',
    });
    this.belongsTo(models.Participant, {
      as: 'participant',
      constraints: false,
      foreignKey: 'participantId',
    });

    this.hasMany(models.TrackHistory, {
      as: 'tracks',
      foreignKey: 'crewId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  VesselParticipantCrew.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      startedStream: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      participantId: {
        type: DataTypes.UUID,
      },
      vesselParticipantId: {
        type: DataTypes.UUID,
      },
    },
    {
      modelName: 'VesselParticipantCrew',
      sequelize,
    },
  );
  return VesselParticipantCrew;
};
