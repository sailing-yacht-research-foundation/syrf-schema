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
    const tableInfo = await queryInterface.describeTable(
      'VesselParticipantCrewTracks',
    );

    if (!tableInfo.competitionUnitId) {
      await queryInterface.addColumn(
        'VesselParticipantCrewTracks',
        'competitionUnitId',
        Sequelize.UUID,
      );
    }
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'VesselParticipantCrewTracks',
      'competitionUnitId',
    );
  },
};
