'use strict';

const tableName = 'Vessels';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);
    if (!table.isDefaultVessel) {
      await queryInterface.addColumn(tableName, 'isDefaultVessel', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable(tableName);
    if (table.isDefaultVessel) {
      await queryInterface.removeColumn(tableName, 'isDefaultVessel');
    }
  },
};
