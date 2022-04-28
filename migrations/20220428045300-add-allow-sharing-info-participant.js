'use strict';

const tableName = 'Participants';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);
    if (!table.allowShareInformations) {
      await queryInterface.addColumn(tableName, 'allowShareInformations', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable(tableName);
    if (table.allowShareInformations)
      await queryInterface.removeColumn(tableName, 'allowShareInformations');
  },
};
