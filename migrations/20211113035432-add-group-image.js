'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable('Groups');
      if (!tableInfo.groupImage) {
        await queryInterface.addColumn(
          'Groups',
          'groupImage',
          Sequelize.STRING,
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable('Groups');
      if (tableInfo.groupImage) {
        await queryInterface.removeColumn('Groups', 'groupImage', {
          transaction,
        });
      }
    });
  },
};
