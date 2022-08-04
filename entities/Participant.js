const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');
const { participantInvitationStatus } = require('../enums');

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
    this.belongsTo(models.CalendarEvent, {
      as: 'event',
      foreignKey: 'calendarEventId',
      constraints: false,
    });
    this.hasMany(models.ParticipantWaiverAgreement, {
      as: 'waiverAgreements',
      foreignKey: 'participantId',
      constraints: false,
    });

    this.belongsToMany(models.CalendarEventDocument, {
      through: models.ParticipantDocumentAgreement,
      as: 'documentAgreements',
      constraints: false,
      foreignKey: 'participantId',
      otherKey: 'documentId',
    });

    this.belongsTo(models.Vessel, {
      as: 'vessel',
      foreignKey: 'vesselId',
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
      calendarEventId: {
        type: DataTypes.UUID,
      },
      userProfileId: {
        type: DataTypes.UUID,
      },
      vesselId: {
        type: DataTypes.UUID,
        comment:
          'This is a temporary default storage to associate vessel with event, by default will be used when vp is created by this participant',
      },
      sailNumber: {
        type: DataTypes.STRING,
        comment:
          'This is a temporary default storage to store vessel sail number for the event, by default will be used when vp is created by this participant',
      },
      invitationStatus: {
        type: DataTypes.ENUM(Object.values(participantInvitationStatus)),
        allowNull: false,
        defaultValue: participantInvitationStatus.INVITED,
      },
      allowShareInformation: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      trackerDistanceToBow: {
        type: DataTypes.FLOAT,
      },
    },
    {
      modelName: 'Participant',
      sequelize,
    },
  );
  return Participant;
};
