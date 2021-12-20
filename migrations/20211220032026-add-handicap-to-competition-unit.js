'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('CompetitionUnits');
    if (!tableInfo.handicap) {
      await queryInterface.addColumn('CompetitionUnits', 'handicap', {
        type: Sequelize.STRING,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CompetitionUnits', 'handicap');
  },
};
