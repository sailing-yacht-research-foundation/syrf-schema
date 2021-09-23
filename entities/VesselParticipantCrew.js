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
    },
    {
      modelName: 'VesselParticipantCrew',
      sequelize,
    },
  );
  return VesselParticipantCrew;
};
