'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.transaction(async (transaction) => {
      const vpTrack = await queryInterface.describeTable(
        'VesselParticipantTrackJsons',
      );

      if (!vpTrack.totalTraveledDistance) {
        await queryInterface.addColumn(
          'VesselParticipantTrackJsons',
          'totalTraveledDistance',
          {
            type: Sequelize.DOUBLE,
            allowNull: false,
            defaultValue: 0,
          },
          { transaction },
        );
      }

      const crewTrack = await queryInterface.describeTable(
        'VesselParticipantCrewTrackJsons',
      );

      if (!crewTrack.totalTraveledDistance) {
        await queryInterface.addColumn(
          'VesselParticipantCrewTrackJsons',
          'totalTraveledDistance',
          {
            type: Sequelize.DOUBLE,
            allowNull: false,
            defaultValue: 0,
          },
          { transaction },
        );
      }

      const vpLeg = await queryInterface.describeTable('VesselParticipantLegs');
      if (!vpLeg.traveledDistance) {
        await queryInterface.addColumn(
          'VesselParticipantLegs',
          'traveledDistance',
          {
            type: Sequelize.DOUBLE,
            allowNull: false,
            defaultValue: 0,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'VesselParticipantLegs',
        'traveledDistance',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        'VesselParticipantCrewTrackJsons',
        'totalTraveledDistance',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        'VesselParticipantTrackJsons',
        'totalTraveledDistance',
        {
          transaction,
        },
      );
    });
  },
};
