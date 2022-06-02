'use strict';
const table = 'Vessels';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    let tableInfo = await queryInterface.describeTable(table);

    if (
      tableInfo.bulkCreated &&
      typeof tableInfo.bulkCreated.defaultValue !== 'boolean'
    ) {
      await queryInterface.changeColumn(table, 'bulkCreated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface) => {
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
