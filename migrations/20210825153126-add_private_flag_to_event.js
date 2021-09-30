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
    const tableInfo = await queryInterface.describeTable('CalendarEvents');

    if (!tableInfo.isPrivate) {
      await queryInterface.addColumn(
        'CalendarEvents',
        'isPrivate',
        Sequelize.BOOLEAN,
      );
    }
  },

  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface) => {
    await queryInterface.removeColumn('CalendarEvents', 'isPrivate');
  },
};
