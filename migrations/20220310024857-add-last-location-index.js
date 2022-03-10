'use strict';

const tableName = 'UserProfiles';
const indexName = 'user_last_location_geog_index';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);
      if (table.lastLocation) {
        // Note: Require to use this, creating index like competition unit start location doesn't reduce the cost of query used as we store in geometry, not geography
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS ${indexName} ON "${tableName}" USING gist( ("lastLocation"::geography) )`,
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(tableName, indexName, {
        transaction,
      });
    });
  },
};
