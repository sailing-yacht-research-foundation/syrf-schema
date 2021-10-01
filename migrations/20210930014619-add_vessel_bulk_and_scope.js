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
    const tableInfo = await queryInterface.describeTable('Vessels');

    if (!tableInfo.scope) {
      await queryInterface.addColumn('Vessels', 'scope', Sequelize.UUID);
      await queryInterface.addColumn(
        'Vessels',
        'bulkCreated',
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
    await queryInterface.removeColumn('Vessels', 'scope');
    await queryInterface.removeColumn('Vessels', 'bulkCreated');
  },
};
