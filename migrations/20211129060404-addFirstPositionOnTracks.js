'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const vpTrack = await queryInterface.describeTable(
        'VesselParticipantTrackJsons',
      );

      if (!vpTrack.firstPosition) {
        await queryInterface.addColumn(
          'VesselParticipantTrackJsons',
          'firstPosition',
          {
            type: Sequelize.GEOMETRY('POINT', 4326),
          },
          { transaction },
        );
      }

      const crewTrack = await queryInterface.describeTable(
        'VesselParticipantCrewTrackJsons',
      );

      if (!crewTrack.firstPosition) {
        await queryInterface.addColumn(
          'VesselParticipantCrewTrackJsons',
          'firstPosition',
          {
            type: Sequelize.GEOMETRY('POINT', 4326),
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'VesselParticipantCrewTrackJsons',
        'firstPosition',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        'VesselParticipantTrackJsons',
        'firstPosition',
        {
          transaction,
        },
      );
    });
  },
};
