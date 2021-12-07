'use strict';

const { calendarEventStatus } = require('../enums');

const tableName = 'CalendarEvents';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);

      if (!table.status) {
        await queryInterface.addColumn(
          tableName,
          'status',
          {
            type: Sequelize.DataTypes.ENUM(Object.values(calendarEventStatus)),
            defaultValue: calendarEventStatus.DRAFT,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'status', {
        transaction,
      });
    });
  },
};
