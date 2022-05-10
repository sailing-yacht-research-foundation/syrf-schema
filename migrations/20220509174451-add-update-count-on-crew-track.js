'use strict';

const crewTrackTableName = 'VesselParticipantCrewTrackJsons';
const vpTrackTableName = 'VesselParticipantTrackJsons';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const crewTrackTable = await queryInterface.describeTable(
        crewTrackTableName,
      );
      if (!crewTrackTable.locationUpdateCount) {
        await queryInterface.addColumn(
          crewTrackTableName,
          'locationUpdateCount',
          {
            type: Sequelize.DataTypes.INTEGER,
          },
          {
            transaction,
          },
        );
      }

      const vpTrackTable = await queryInterface.describeTable(vpTrackTableName);
      if (!vpTrackTable.locationUpdateCount) {
        await queryInterface.addColumn(
          vpTrackTableName,
          'locationUpdateCount',
          {
            type: Sequelize.DataTypes.INTEGER,
          },
          {
            transaction,
          },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const crewTrackTable = await queryInterface.describeTable(
        crewTrackTableName,
      );
      if (crewTrackTable.locationUpdateCount) {
        await queryInterface.removeColumn(
          crewTrackTableName,
          'locationUpdateCount',
          {
            transaction,
          },
        );
      }

      const vpTrackTable = await queryInterface.describeTable(vpTrackTableName);
      if (vpTrackTable.locationUpdateCount) {
        await queryInterface.removeColumn(
          vpTrackTableName,
          'locationUpdateCount',
          {
            transaction,
          },
        );
      }
    });
  },
};
