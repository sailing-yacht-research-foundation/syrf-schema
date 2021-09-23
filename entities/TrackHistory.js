const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class TrackHistory extends ModelBase {
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'profile',
      foreignKey: 'userProfileId',
      constraints: false,
    });
    this.belongsTo(models.Participant, {
      as: 'participant',
      foreignKey: 'participantId',
      constraints: false,
    });
    this.belongsTo(models.CompetitionUnit, {
      as: 'competitionUnit',
      foreignKey: 'competitionUnitId',
      constraints: false,
    });
    this.belongsTo(models.VesselParticipant, {
      as: 'vesselParticipant',
      foreignKey: 'vesselParticipantId',
      constraints: false,
    });
    this.belongsTo(models.VesselParticipantCrew, {
      as: 'crew',
      foreignKey: 'crewId',
      constraints: false,
    });
    this.belongsTo(models.VesselParticipantGroup, {
      as: 'group',
      foreignKey: 'vesselParticipantGroupId',
      constraints: false,
    });
    this.belongsTo(models.CalenderEvent, {
      as: 'event',
      foreignKey: 'calendarEventId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  TrackHistory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      modelName: 'TrackHistory',
      sequelize,
    },
  );
  return TrackHistory;
};
