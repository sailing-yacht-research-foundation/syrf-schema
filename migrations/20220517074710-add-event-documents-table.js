'use strict';

const calendarEventDocumentTableName = 'CalendarEventDocuments';
const participantDocumentAgreementTableName = 'ParticipantDocumentAgreements';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let calendarEventDocumentTable;
      try {
        calendarEventDocumentTable = await queryInterface.describeTable(
          calendarEventDocumentTableName,
        );
      } catch (err) {
        calendarEventDocumentTable = null;
      }
      if (!calendarEventDocumentTable) {
        await queryInterface.createTable(
          calendarEventDocumentTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            calendarEventId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            documentName: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            isRequired: {
              type: Sequelize.DataTypes.BOOLEAN,
              allowNull: false,
            },
            documentUrl: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            uploaderId: {
              type: Sequelize.DataTypes.UUID,
              comment: 'The admin that uploads the document',
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            updatedAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
          },
          {
            transaction,
          },
        );
      }

      let participantDocumentAgreementTable;
      try {
        participantDocumentAgreementTable = await queryInterface.describeTable(
          participantDocumentAgreementTableName,
        );
      } catch (err) {
        participantDocumentAgreementTable = null;
      }
      if (!participantDocumentAgreementTable) {
        await queryInterface.createTable(
          participantDocumentAgreementTableName,
          {
            participantId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
              primaryKey: true,
            },
            documentId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
              primaryKey: true,
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            updatedAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
          },
          {
            transaction,
          },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let calendarEventDocumentTable;
      try {
        calendarEventDocumentTable = await queryInterface.describeTable(
          calendarEventDocumentTableName,
        );
      } catch (err) {
        calendarEventDocumentTable = null;
      }
      if (calendarEventDocumentTable) {
        await queryInterface.dropTable(calendarEventDocumentTableName, {
          transaction,
        });
      }

      let participantDocumentAgreementTable;
      try {
        participantDocumentAgreementTable = await queryInterface.describeTable(
          participantDocumentAgreementTableName,
        );
      } catch (err) {
        participantDocumentAgreementTable = null;
      }
      if (participantDocumentAgreementTable) {
        await queryInterface.dropTable(participantDocumentAgreementTableName, {
          transaction,
        });
      }
    });
  },
};
