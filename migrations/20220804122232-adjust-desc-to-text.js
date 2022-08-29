'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */

const eventTableName = 'CalendarEvents';
const competitionTableName = 'CompetitionUnits';

module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let eventTableInfo = null,
        competitionTableInfo = null;
      try {
        [eventTableInfo, competitionTableInfo] = await Promise.all([
          queryInterface.describeTable(eventTableName),
          queryInterface.describeTable(competitionTableName),
        ]);
      } catch (err) {}

      if (eventTableInfo && !eventTableInfo.description.type !== 'TEXT') {
        await queryInterface.changeColumn(
          eventTableName,
          'description',
          {
            type: Sequelize.TEXT,
          },
          {
            transaction,
          },
        );
      }

      if (
        competitionTableInfo &&
        !competitionTableInfo.description.type !== 'TEXT'
      ) {
        await queryInterface.changeColumn(
          competitionTableName,
          'description',
          {
            type: Sequelize.TEXT,
          },
          {
            transaction,
          },
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
      let eventTableInfo = null,
        competitionTableInfo = null;
      try {
        [eventTableInfo, competitionTableInfo] = await Promise.all([
          queryInterface.describeTable(eventTableName),
          queryInterface.describeTable(competitionTableName),
        ]);
      } catch (err) {}

      if (eventTableInfo && eventTableInfo.description) {
        await queryInterface.changeColumn(
          eventTableName,
          'description',
          {
            type: Sequelize.STRING(1000),
          },
          {
            transaction,
          },
        );
      }

      if (eventTableInfo && eventTableInfo.description) {
        await queryInterface.changeColumn(
          competitionTableInfo,
          'description',
          {
            type: Sequelize.STRING(1000),
          },
          {
            transaction,
          },
        );
      }
    });
  },
};
