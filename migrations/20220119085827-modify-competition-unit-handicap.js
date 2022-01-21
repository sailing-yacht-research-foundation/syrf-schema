'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(
        'CompetitionUnits',
      );
      if (tableInfo.handicap) {
        await queryInterface.changeColumn(
          'CompetitionUnits',
          'handicap',
          { type: Sequelize.ARRAY(Sequelize.STRING) + 'USING ARRAY[handicap]' },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(
        'CompetitionUnits',
      );
      if (tableInfo.handicap) {
        await queryInterface.changeColumn(
          'CompetitionUnits',
          'handicap',
          { type: Sequelize.STRING },
          {
            transaction,
          },
        );
      }
    });
  },
};
