'use strict';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */

const participantTableName = 'Participants';
const vpTableName = 'VesselParticipants';

module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let participantTableInfo = null,
        vpTableInfo = null;
      try {
        [participantTableInfo, vpTableInfo] = await Promise.all([
          queryInterface.describeTable(participantTableName),
          queryInterface.describeTable(vpTableName),
        ]);
      } catch (err) {}

      if (participantTableInfo && !participantTableInfo.trackerDistanceToBow) {
        await queryInterface.addColumn(
          participantTableName,
          'trackerDistanceToBow',
          {
            type: Sequelize.FLOAT,
          },
          {
            transaction,
          },
        );
      }

      if (vpTableInfo && !vpTableInfo.trackerDistanceToBow) {
        await queryInterface.addColumn(
          vpTableName,
          'trackerDistanceToBow',
          {
            type: Sequelize.FLOAT,
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
      let participantTableInfo = null,
        vpTableInfo = null;
      try {
        [participantTableInfo, vpTableInfo] = await Promise.all([
          queryInterface.describeTable(participantTableName),
          queryInterface.describeTable(vpTableName),
        ]);
      } catch (err) {}

      if (participantTableInfo && participantTableInfo.trackerDistanceToBow) {
        await queryInterface.removeColumn(
          participantTableName,
          'trackerDistanceToBow',
          {
            transaction,
          },
        );
      }

      if (vpTableInfo && !vpTableInfo.trackerDistanceToBow) {
        await queryInterface.removeColumn(vpTableName, 'trackerDistanceToBow', {
          transaction,
        });
      }
    });
  },
};
