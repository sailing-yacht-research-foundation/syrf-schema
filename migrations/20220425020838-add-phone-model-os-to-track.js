'use strict';

const tableName = 'TrackHistories';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);
    if (!table.phoneModel) {
      await queryInterface.addColumn(tableName, 'phoneModel', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!table.phoneOS) {
      await queryInterface.addColumn(tableName, 'phoneOS', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable(tableName);
    if (table.phoneModel) {
      await queryInterface.removeColumn(tableName, 'phoneModel');
    }
    if (table.phoneOS) {
      await queryInterface.removeColumn(tableName, 'phoneOS');
    }
  },
};
