'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const vesselsTable = await queryInterface.describeTable('Vessels');
      if (!vesselsTable.model) {
        await queryInterface.addColumn(
          'Vessels',
          'model',
          Sequelize.STRING,
          { transaction },
        );
      }
      if (!vesselsTable.widthInMeters) {
        await queryInterface.addColumn(
          'Vessels',
          'widthInMeters',
          Sequelize.FLOAT,
          { transaction },
        );
      }
      if (!vesselsTable.draftInMeters) {
        await queryInterface.addColumn(
          'Vessels',
          'draftInMeters',
          Sequelize.FLOAT,
          { transaction },
        );
      }
      if (!vesselsTable.handicap) {
        await queryInterface.addColumn(
          'Vessels',
          'handicap',
          Sequelize.JSON,
          { transaction },
        );
      }
      if (!vesselsTable.source) {
        await queryInterface.addColumn(
          'Vessels',
          'source',
          Sequelize.STRING,
          { transaction },
        );
      }

      const vesselParticipantsTable = await queryInterface.describeTable('VesselParticipants');
      if (!vesselParticipantsTable.handicap) {
        await queryInterface.addColumn(
          'VesselParticipants',
          'handicap',
          Sequelize.JSON,
          { transaction },
        );
      }

      const eventsTable = await queryInterface.describeTable('CalendarEvents');
      if (!eventsTable.scrapedOriginalId) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'scrapedOriginalId',
          Sequelize.STRING,
          { transaction },
        );
      }

      const competitionsTable = await queryInterface.describeTable('CompetitionUnits');
      if (!competitionsTable.scrapedOriginalId) {
        await queryInterface.addColumn(
          'CompetitionUnits',
          'scrapedOriginalId',
          Sequelize.STRING,
          { transaction },
        );
      }
      if (!competitionsTable.scrapedUrl) {
        await queryInterface.addColumn(
          'CompetitionUnits',
          'scrapedUrl',
          Sequelize.STRING,
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Vessels', 'model', {
        transaction,
      });
      await queryInterface.removeColumn('Vessels', 'widthInMeters', {
        transaction,
      });
      await queryInterface.removeColumn('Vessels', 'draftInMeters', {
        transaction,
      });
      await queryInterface.removeColumn('Vessels', 'handicap', {
        transaction,
      });
      await queryInterface.removeColumn('Vessels', 'source', {
        transaction,
      });

      await queryInterface.removeColumn('VesselParticipants', 'handicap', {
        transaction,
      });

      await queryInterface.removeColumn('CalendarEvents', 'scrapedOriginalId', {
        transaction,
      });

      await queryInterface.removeColumn('CompetitionUnits', 'scrapedOriginalId', {
        transaction,
      });

      await queryInterface.removeColumn('CompetitionUnits', 'scapedUrl', {
        transaction,
      });
    });
  }
};
