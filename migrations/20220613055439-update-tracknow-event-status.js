'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */

const table = 'UserProfiles';
module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    const [, meta] = await queryInterface.sequelize.query(
      `UPDATE "CalendarEvents" AS e SET "status" = 'COMPLETED' FROM "CompetitionUnits" AS c WHERE c."calendarEventId" = e."id" AND e."isPrivate" = true and c."status" = 'COMPLETED'`,
    );
    console.log(
      meta.rowCount,
      'private ongoing event with completed race events updated',
    );
  },

  down: async (queryInterface, Sequelize) => {},
};
