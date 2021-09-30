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
      'VesselParticipantCrews',
    );

    if (!tableInfo.startedStream) {
      await queryInterface.addColumn(
        'VesselParticipantCrews',
        'startedStream',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
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
      'VesselParticipantCrews',
      'startedStream',
    );
  },
};
