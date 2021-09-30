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

    if (tableInfo.boundingBox.type === 'JSON') {
      await queryInterface.removeColumn('CompetitionUnits', 'boundingBox');

      await queryInterface.addColumn(
        'CompetitionUnits',
        'boundingBox',
        Sequelize.GEOMETRY('POLYGON', 4326),
      );
    }
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CompetitionUnits', 'boundingBox');

    await queryInterface.addColumn(
      'CompetitionUnits',
      'boundingBox',
      Sequelize.JSON,
    );
  },
};
