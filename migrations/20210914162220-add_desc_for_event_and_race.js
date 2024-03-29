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

    if (!tableInfo.description) {
      await queryInterface.addColumn(
        'CalendarEvents',
        'description',
        Sequelize.STRING(1000),
      );
      await queryInterface.addColumn(
        'CalendarEvents',
        'country',
        Sequelize.STRING,
      );
      await queryInterface.addColumn(
        'CalendarEvents',
        'city',
        Sequelize.STRING(1000),
      );
      await queryInterface.addColumn(
        'CompetitionUnits',
        'description',
        Sequelize.STRING,
      );
    }
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface) => {
    await queryInterface.removeColumn('CalendarEvents', 'description');
    await queryInterface.removeColumn('CalendarEvents', 'country');
    await queryInterface.removeColumn('CalendarEvents', 'city');
    await queryInterface.removeColumn('CompetitionUnits', 'description');
  },
};
