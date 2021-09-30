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
    const tableInfo = await queryInterface.describeTable('Courses');

    if (!tableInfo.calendarEventId) {
      await queryInterface.addColumn(
        'Courses',
        'calendarEventId',
        Sequelize.UUID,
      );
      await queryInterface.addColumn('Courses', 'name', Sequelize.STRING);
    }
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Courses', 'calendarEventId');
    await queryInterface.removeColumn('Courses', 'name');
  },
};
