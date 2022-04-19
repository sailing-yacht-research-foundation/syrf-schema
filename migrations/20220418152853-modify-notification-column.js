'use strict';

const tableName = 'UserNotifications';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(tableName);
      if (tableInfo.notificationMessage) {
        await queryInterface.changeColumn(
          tableName,
          'notificationMessage',
          { type: Sequelize.TEXT, allowNull: false },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(tableName);
      if (tableInfo.notificationMessage) {
        await queryInterface.changeColumn(
          tableName,
          'notificationMessage',
          { type: Sequelize.STRING, allowNull: false },
          {
            transaction,
          },
        );
      }
    });
  },
};
