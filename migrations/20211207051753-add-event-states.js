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

      if (!table.allowRegistration) {
        await queryInterface.addColumn(
          tableName,
          'allowRegistration',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment:
              'Different from isOpen. This columns serve as open/close the self registration.',
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'allowRegistration', {
        transaction,
      });
      await queryInterface.removeColumn(tableName, 'status', {
        transaction,
      });
    });
  },
};
