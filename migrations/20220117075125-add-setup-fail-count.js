'use strict';

const tableName = 'CompetitionUnits';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);

      if (!table.failedSetupCount) {
        await queryInterface.addColumn(
          tableName,
          'failedSetupCount',
          {
            type: Sequelize.DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment:
              'How many times analysis engine start this competition but crashes in the middle',
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'failedSetupCount', {
        transaction,
      });
    });
  },
};
