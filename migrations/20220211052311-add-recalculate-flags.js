'use strict';

const resultTableName = 'CompetitionResults';
const interactionTableName = 'VesselParticipantEvents';
const legTableName = 'VesselParticipantLegs';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const resultTable = await queryInterface.describeTable(resultTableName);

      if (!resultTable.isRecalculated) {
        await queryInterface.addColumn(
          resultTableName,
          'isRecalculated',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: true,
          },
          { transaction },
        );
      }

      const interactionTable = await queryInterface.describeTable(
        interactionTableName,
      );

      if (!interactionTable.isRecalculated) {
        await queryInterface.addColumn(
          interactionTableName,
          'isRecalculated',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: true,
          },
          { transaction },
        );
      }

      const legTable = await queryInterface.describeTable(legTableName);

      if (!legTable.isRecalculated) {
        await queryInterface.addColumn(
          legTableName,
          'isRecalculated',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(resultTableName, 'isRecalculated', {
        transaction,
      });
      await queryInterface.removeColumn(
        interactionTableName,
        'isRecalculated',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(legTableName, 'isRecalculated', {
        transaction,
      });
    });
  },
};
