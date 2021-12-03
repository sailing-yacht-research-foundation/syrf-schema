'use strict';

const tableName = 'VesselParticipantTrackJsons';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);

      if (!table.startTime) {
        await queryInterface.addColumn(
          tableName,
          'startTime',
          {
            type: Sequelize.DATE,
          },
          { transaction },
        );
      }
      if (!table.endTime) {
        await queryInterface.addColumn(
          tableName,
          'endTime',
          {
            type: Sequelize.DATE,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'startTime', {
        transaction,
      });
      await queryInterface.removeColumn(tableName, 'endTime', {
        transaction,
      });
    });
  },
};
