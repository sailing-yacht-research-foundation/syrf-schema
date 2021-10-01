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
        'CompetitionUnits',
        'approximateStartLocation',
        Sequelize.GEOMETRY('POINT', 4326),
      );
      await queryInterface.addColumn(
        'CompetitionUnits',
        'approximateEndLocation',
        Sequelize.GEOMETRY('POINT', 4326),
      );
      await queryInterface.addColumn(
        'CompetitionUnits',
        'country',
        Sequelize.STRING,
      );
      await queryInterface.addColumn(
        'CompetitionUnits',
        'city',
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
    await queryInterface.removeColumn(
      'CompetitionUnits',
      'approximateStartLocation',
    );
    await queryInterface.removeColumn(
      'CompetitionUnits',
      'approximateEndLocation',
    );
    await queryInterface.removeColumn('CompetitionUnits', 'country');
    await queryInterface.removeColumn('CompetitionUnits', 'city');
  },
};
