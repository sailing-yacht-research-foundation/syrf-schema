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
    const tableInfo = await queryInterface.describeTable('CompetitionUnits');

    if (!tableInfo.endTime) {
      queryInterface.addColumn('CompetitionUnits', 'endTime', Sequelize.DATE);
      queryInterface.addColumn('CompetitionUnits', 'timeLimit', Sequelize.DATE);
      queryInterface.addColumn(
        'CalendarEvents',
        'approximateEndTime',
        Sequelize.DATE,
      );
    }
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface) => {
    queryInterface.removeColumn('CompetitionUnits', 'endTime');
    queryInterface.removeColumn('CompetitionUnits', 'timeLimit');
    queryInterface.removeColumn('CalendarEvents', 'approximateEndTime');
  },
};
