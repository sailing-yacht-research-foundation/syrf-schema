'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(
        'CompetitionResults',
      );

      if (tableInfo.time) {
        await queryInterface.changeColumn(
          'CompetitionResults',
          'time',
          Sequelize.BIGINT,
          { transaction },
        );
      }
    });
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(
        'CompetitionResults',
      );
      if (tableInfo.time)
        await queryInterface.changeColumn(
          'CompetitionResults',
          'time',
          Sequelize.INTEGER,
          { transaction },
        );
    });
  },
};
