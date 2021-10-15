'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */
module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo = await queryInterface.describeTable('CalendarEvents');

      if (tableInfo.ics) {
        await queryInterface.changeColumn(
          'CalendarEvents',
          'ics',
          Sequelize.TEXT,
          { transaction },
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
      let tableInfo = await queryInterface.describeTable('CalendarEvents');
      if (tableInfo.ics)
        await queryInterface.changeColumn(
          'CalendarEvents',
          'ics',
          Sequelize.STRING,
          { transaction },
        );
    });
  },
};
