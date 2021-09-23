const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class Participant extends ModelBase {
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'profile',
      foreignKey: 'userProfileId',
      constraints: false,
    });
    this.belongsToMany(models.VesselParticipant, {
      as: 'vesselParticipants',
      through: models.VesselParticipantCrew,
      foreignKey: 'participantId',
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
  Participant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      participantId: {
        type: DataTypes.STRING,
      },
      publicName: {
        type: DataTypes.STRING,
      },
      trackerUrl: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: 'Participant',
      sequelize,
    },
  );
  return Participant;
};
