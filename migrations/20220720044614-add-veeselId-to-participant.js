'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */

const tableName = 'Participants';

module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo = null;
      try {
        tableInfo = await queryInterface.describeTable(tableName);
      } catch (err) {}

      if (tableInfo && !tableInfo.vesselId) {
        await queryInterface.addColumn(
          tableName,
          'vesselId',
          {
            type: Sequelize.UUID,
            comment:
              'This is a temporary default storage to associate vessel with event, by default will be used when vp is created by this participant',
          },
          {
            transaction,
          },
        );
      }

      if (tableInfo && !tableInfo.sailNumber) {
        await queryInterface.addColumn(
          tableName,
          'sailNumber',
          {
            type: Sequelize.STRING,
            comment:
              'This is a temporary default storage to store vessel sail number for the event, by default will be used when vp is created by this participant',
          },
          {
            transaction,
          },
        );
      }
    });
  },

  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo = null;
      try {
        tableInfo = await queryInterface.describeTable(tableName);
      } catch (err) {}

      if (tableInfo && tableInfo.vesselId) {
        await queryInterface.removeColumn(tableName, 'vesselId', {
          transaction,
        });
      }

      if (tableInfo && !tableInfo.sailNumber) {
        await queryInterface.removeColumn(tableName, 'sailNumber', {
          transaction,
        });
      }
    });
  },
};
