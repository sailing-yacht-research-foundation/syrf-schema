const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class ParticipantDocumentAgreement extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.CalendarEventDocument, {
      as: 'document',
      constraints: false,
      foreignKey: 'documentId',
    });
    this.belongsTo(models.Participant, {
      as: 'participant',
      constraints: false,
      foreignKey: 'participantId',
    });
  }
}

module.exports = (sequelize) => {
  ParticipantDocumentAgreement.init(
    {
      participantId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      modelName: 'ParticipantDocumentAgreement',
      sequelize,
    },
  );
  return ParticipantDocumentAgreement;
};
