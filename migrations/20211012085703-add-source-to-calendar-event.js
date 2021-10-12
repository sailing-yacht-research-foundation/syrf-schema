'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('CalendarEvents');

    if (!tableInfo.source) {
      await queryInterface.addColumn('CalendarEvents', 'source', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CalendarEvents', 'source');
  },
};
