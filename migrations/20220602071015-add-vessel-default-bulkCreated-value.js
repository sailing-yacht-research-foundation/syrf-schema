'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */

const table = 'Vessels';
module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    let tableInfo = await queryInterface.describeTable(table);

    if (
      tableInfo.bulkCreated &&
      typeof tableInfo.bulkCreated.defaultValue !== 'boolean'
    ) {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(
          `update "Vessels" set "bulkCreated" = false where "bulkCreated" is null`,
          {
            transaction,
          },
        );

        await queryInterface.changeColumn(
          table,
          'bulkCreated',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          {
            transaction,
          },
        );
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    let tableInfo = await queryInterface.describeTable(table);

    if (
      tableInfo.bulkCreated &&
      typeof tableInfo.bulkCreated.defaultValue === 'boolean'
    ) {
      await queryInterface.changeColumn(
        table,
        'bulkCreated',
        Sequelize.BOOLEAN,
      );
    }
  },
};
