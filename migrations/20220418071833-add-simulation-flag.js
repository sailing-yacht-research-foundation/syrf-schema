'use strict';

const tableName = 'CalendarEvents';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);
    if (!table.isSimulation) {
      await queryInterface.addColumn(tableName, 'isSimulation', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable(tableName);
    if (table.isSimulation)
      await queryInterface.removeColumn(tableName, 'isSimulation');
  },
};
