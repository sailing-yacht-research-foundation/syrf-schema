const { DataTypes } = require('sequelize');

const ModelBase = require('../ModelBase');

class CalendarEventDocument extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'uploader',
      constraints: false,
      foreignKey: 'uploaderId',
    });
    this.belongsTo(models.CalendarEvent, {
      as: 'event',
      constraints: false,
      foreignKey: 'calendarEventId',
    });

    this.belongsToMany(models.Participant, {
      through: models.ParticipantDocumentAgreement,
      as: 'participants',
      constraints: false,
      foreignKey: 'documentId',
      otherKey: 'participantId',
    });
  }
}

module.exports = (sequelize) => {
  CalendarEventDocument.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      calendarEventId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      documentName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      documentUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      uploaderId: {
        type: DataTypes.UUID,
        comment: 'The admin that uploads the document',
      },
    },
    {
      modelName: 'CalendarEventDocument',
      sequelize,
    },
  );
  return CalendarEventDocument;
};
