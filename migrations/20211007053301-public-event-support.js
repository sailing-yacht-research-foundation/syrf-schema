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
      const eventInfo = await queryInterface.describeTable('CalendarEvents');
      if (!eventInfo.isOpen) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'isOpen',
          Sequelize.BOOLEAN,
          { transaction },
        );
      }
      if (!eventInfo.location) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'location',
          Sequelize.GEOMETRY('POINT', 4326),
          { transaction },
        );
        await queryInterface.addIndex('CalendarEvents', ['location'], {
          unique: false,
          type: 'SPATIAL',
          using: 'GIST',
          name: 'calendar_event_location_index',
          transaction,
        });
      }
      await queryInterface.addIndex(
        'CompetitionUnits',
        ['approximateStartLocation'],
        {
          unique: false,
          type: 'SPATIAL',
          using: 'GIST',
          name: 'competition_start_location_index',
          transaction,
        },
      );
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
      await queryInterface.removeColumn('CalendarEvents', 'isOpen', {
        transaction,
      });
      await queryInterface.removeColumn('CalendarEvents', 'location', {
        transaction,
      });
      await queryInterface.removeIndex(
        'CalendarEvents',
        'calendar_event_location_index',
        { transaction },
      );
      await queryInterface.removeIndex(
        'CompetitionUnits',
        'competition_start_location_index',
        { transaction },
      );
    });
  },
};
