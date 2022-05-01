'use strict';

const { waiverTypes } = require('../enums');

const tableName = 'Participants';
const waiverAgreementTableName = 'ParticipantWaiverAgreements';
const vpTableName = 'VesselParticipants';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);
      if (!table.allowShareInformation) {
        await queryInterface.addColumn(
          tableName,
          'allowShareInformation',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          {
            transaction,
          },
        );
      }

      let waiverAgreementTable;
      try {
        waiverAgreementTable = await queryInterface.describeTable(
          waiverAgreementTableName,
        );
      } catch (err) {
        waiverAgreementTable = null;
      }
      if (!waiverAgreementTable) {
        await queryInterface.createTable(
          waiverAgreementTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            participantId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            waiverType: {
              type: Sequelize.DataTypes.ENUM(Object.values(waiverTypes)),
              allowNull: false,
            },
            agreedAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
          },
          {
            transaction,
          },
        );
      }

      const vpTable = await queryInterface.describeTable(vpTableName);
      if (!vpTable.sailNumber) {
        await queryInterface.addColumn(
          tableName,
          'sailNumber',
          {
            type: Sequelize.STRING,
            comment:
              'Value during joining competition/accepting ivnitation. Default to vessel sailNumber from frontends',
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
      let waiverAgreementTable;
      try {
        waiverAgreementTable = await queryInterface.describeTable(
          waiverAgreementTableName,
        );
      } catch (err) {
        waiverAgreementTable = null;
      }
      if (waiverAgreementTable) {
        await queryInterface.dropTable(waiverAgreementTableName, {
          transaction,
        });
      }

      const table = await queryInterface.describeTable(tableName);
      if (table.allowShareInformation) {
        await queryInterface.removeColumn(tableName, 'allowShareInformation', {
          transaction,
        });
      }

      const vpTable = await queryInterface.describeTable(vpTableName);
      if (vpTable.sailNumber) {
        await queryInterface.removeColumn(tableName, 'sailNumber', {
          transaction,
        });
      }
    });
  },
};
