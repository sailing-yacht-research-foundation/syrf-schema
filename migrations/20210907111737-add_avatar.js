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
    const tableInfo = await queryInterface.describeTable('UserProfiles');

    if (!tableInfo.avatar) {
      await queryInterface.addColumn(
        'UserProfiles',
        'avatar',
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
    await queryInterface.removeColumn('UserProfiles', 'avatar');
  },
};
