'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable('CalendarEvents');
      if (!tableInfo.endLocation) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'endLocation',
          Sequelize.GEOMETRY('POINT', 4326),
          { transaction },
        );
      }
      if (tableInfo.lon) {
        await queryInterface.removeColumn('CalendarEvents', 'lon', {
          transaction,
        });
      }
      if (tableInfo.lat) {
        await queryInterface.removeColumn('CalendarEvents', 'lat', {
          transaction,
        });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable('CalendarEvents');
      if (tableInfo.endLocation) {
        await queryInterface.removeColumn('CalendarEvents', 'endLocation', {
          transaction,
        });
      }
      if (!tableInfo.lon) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'lon',
          Sequelize.FLOAT,
          {
            transaction,
          },
        );
      }
      if (!tableInfo.lat) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'lat',
          Sequelize.FLOAT,
          {
            transaction,
          },
        );
      }
    });
  },
};
