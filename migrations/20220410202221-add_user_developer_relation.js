'use strict';

const tableName = 'UserProfiles';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);
    if (!table.developerAccountId) {
      await queryInterface.addColumn(tableName, 'developerAccountId', {
        type: Sequelize.DataTypes.UUID,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable(tableName);
    if (table.developerAccountId)
      await queryInterface.removeColumn(tableName, 'developerAccountId');
  },
};
