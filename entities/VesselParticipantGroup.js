const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class VesselParticipantGroup extends ModelBase {
  static associate(models) {
    this.hasMany(models.VesselParticipant, {
      as: 'vesselParticipants',
      constraints: false,
      foreignKey: 'vesselParticipantGroupId',
    });

    this.hasMany(models.CompetitionUnit, {
      as: 'competitionUnit',
      constraints: false,
      foreignKey: 'vesselParticipantGroupId',
    });
  }
}

module.exports = (sequelize) => {
  VesselParticipantGroup.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      vesselParticipantGroupId: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: 'VesselParticipantGroup',
      sequelize,
    },
  );
  return VesselParticipantGroup;
};
