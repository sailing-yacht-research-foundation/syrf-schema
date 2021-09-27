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
    await queryInterface.addColumn(
      'CompetitionUnits',
      'approximateStart_utc',
      Sequelize.DATE,
    );
    await queryInterface.addColumn(
      'CalendarEvents',
      'approximateStartTime_utc',
      Sequelize.DATE,
    );
    await queryInterface.addColumn(
      'CalendarEvents',
      'approximateEndTime_utc',
      Sequelize.DATE,
    );

    await queryInterface.addColumn(
      'CompetitionUnits',
      'approximateStart_zone',
      Sequelize.STRING,
    );
    await queryInterface.addColumn(
      'CalendarEvents',
      'approximateStartTime_zone',
      Sequelize.STRING,
    );
    await queryInterface.addColumn(
      'CalendarEvents',
      'approximateEndTime_zone',
      Sequelize.STRING,
    );
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'CompetitionUnits',
      'approximateStart_utc',
    );
    await queryInterface.removeColumn(
      'CalendarEvents',
      'approximateStartTime_utc',
    );
    await queryInterface.removeColumn(
      'CalendarEvents',
      'approximateEndTime_utc',
    );

    await queryInterface.removeColumn(
      'CompetitionUnits',
      'approximateStart_zone',
    );
    await queryInterface.removeColumn(
      'CalendarEvents',
      'approximateStartTime_zone',
    );
    await queryInterface.removeColumn(
      'CalendarEvents',
      'approximateEndTime_zone',
    );
  },
};
