'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */

const table = 'UserProfiles';
module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    let tableInfo = await queryInterface.describeTable(table);

    if (tableInfo.bio && tableInfo.bio.type !== 'TEXT') {
      await queryInterface.changeColumn(table, 'bio', {
        type: Sequelize.TEXT,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    let tableInfo = await queryInterface.describeTable(table);

    if (tableInfo.bio && tableInfo.bio.type === 'TEXT') {
      await queryInterface.changeColumn(table, 'bio', Sequelize.STRING);
    }
  },
};
