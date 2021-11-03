'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('CalendarEvents');

    if (!tableInfo.endLocation) {
      await queryInterface.addColumn('CalendarEvents', 'endLocation', {
        type: Sequelize.GEOMETRY('POINT', 4326),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('CalendarEvents');

    if (tableInfo.endLocation) {
      await queryInterface.removeColumn('CalendarEvents', 'endLocation');
    }
  },
};
