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
      const compInfo = await queryInterface.describeTable('CalendarEvents');
      if (!compInfo.isOpen) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'isOpen',
          Sequelize.BOOLEAN,
          { transaction },
        );
      }
      if (!compInfo.location) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'location',
          Sequelize.GEOMETRY('POINT', 4326),
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
      await queryInterface.removeColumn('CalendarEvents', 'isOpen', {
        transaction,
      });
      await queryInterface.removeColumn('CalendarEvents', 'location', {
        transaction,
      });
    });
  },
};
