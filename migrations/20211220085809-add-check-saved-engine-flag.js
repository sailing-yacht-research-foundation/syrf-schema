'use strict';

const tableName = 'CompetitionUnits';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);

    if (!table.isSavedByEngine) {
      await queryInterface.addColumn(tableName, 'isSavedByEngine', {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
        comment:
          'Flag to check if competition has been run and saved by Analysis Engine',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(tableName, 'isSavedByEngine');
  },
};
