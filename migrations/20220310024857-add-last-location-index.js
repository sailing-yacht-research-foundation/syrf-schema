'use strict';

const tableName = 'UserProfiles';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);
      if (table.lastLocation) {
        await queryInterface.addIndex(tableName, ['lastLocation'], {
          unique: false,
          type: 'SPATIAL',
          using: 'GIST',
          name: 'user_last_location_index',
          transaction,
        });
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(tableName, 'user_last_location_index', {
        transaction,
      });
    });
  },
};
