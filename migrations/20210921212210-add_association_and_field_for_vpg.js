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
      'VesselParticipantGroups',
    );

    if (!tableInfo.calendarEventId) {
      await queryInterface.addColumn(
        'VesselParticipantGroups',
        'calendarEventId',
        Sequelize.UUID,
      );
      await queryInterface.addColumn(
        'VesselParticipantGroups',
        'name',
        Sequelize.STRING,
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
      'VesselParticipantGroups',
      'calendarEventId',
    );
    await queryInterface.removeColumn('VesselParticipantGroups', 'name');
  },
};
