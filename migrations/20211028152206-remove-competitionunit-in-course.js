'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let tableInfo = await queryInterface.describeTable('Courses');

    if (tableInfo.competitionUnitId) {
      await queryInterface.removeColumn('Courses', 'competitionUnitId');
    }
  },

  down: async (queryInterface, Sequelize) => {
    let tableInfo = await queryInterface.describeTable('Courses');

    if (!tableInfo.competitionUnitId) {
      await queryInterface.addColumn('Courses', 'competitionUnitId', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
  },
};
