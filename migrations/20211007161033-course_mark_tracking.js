'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */
module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo = await queryInterface.describeTable('CompetitionUnits');

      if (!tableInfo.status) {
        await queryInterface.addColumn(
          'CompetitionUnits',
          'status',
          Sequelize.STRING(20),
          { transaction },
        );
      }

      tableInfo = await queryInterface.describeTable('CoursePoints');

      if (!tableInfo.properties) {
        await queryInterface.addColumn(
          'CoursePoints',
          'properties',
          Sequelize.JSON,
          { transaction },
        );
      }

      if (!tableInfo.markTrackerId) {
        await queryInterface.addColumn(
          'CoursePoints',
          'markTrackerId',
          Sequelize.UUID,
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
  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo = await queryInterface.describeTable('CompetitionUnits');
      if (tableInfo.status)
        await queryInterface.removeColumn('CompetitionUnits', 'status', {
          transaction,
        });

      tableInfo = await queryInterface.describeTable('CoursePoints');

      if (tableInfo.properties)
        await queryInterface.removeColumn('CoursePoints', 'properties', {
          transaction,
        });
      if (tableInfo.markTrackerId)
        await queryInterface.removeColumn('CoursePoints', 'markTrackerId', {
          transaction,
        });
    });
  },
};
