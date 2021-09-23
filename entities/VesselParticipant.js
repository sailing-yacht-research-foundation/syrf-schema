const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class VesselParticipant extends ModelBase {
  static associate(models) {
    this.belongsToMany(models.Participant, {
      as: 'participants',
      through: models.VesselParticipantCrew,
      foreignKey: 'vesselParticipantId',
      constraints: false,
    });

    this.belongsTo(models.Vessel, {
      as: 'vessel',
      constraints: false,
      foreignKey: 'vesselId',
    });

    this.belongsToMany(models.UserProfile, {
      through: 'VesselParticipantEditors',
      as: 'editors',
      constraints: false,
    });

    this.belongsTo(models.UserProfile, {
      as: 'owner',
      foreignKey: 'ownerId',
      constraints: false,
    });

    this.belongsTo(models.VesselParticipantGroup, {
      as: 'group',
      constraints: false,
      foreignKey: 'vesselParticipantGroupId',
    });
  }
}

module.exports = (sequelize) => {
  VesselParticipant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      vesselParticipantId: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: 'VesselParticipant',
      sequelize,
    },
  );
  return VesselParticipant;
};
