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
      const compInfo = await queryInterface.describeTable('CompetitionUnits');
      if (!compInfo.openGraphImage) {
        await queryInterface.addColumn(
          'CompetitionUnits',
          'openGraphImage',
          Sequelize.STRING,
          { transaction },
        );
      }
      const eventInfo = await queryInterface.describeTable('CalendarEvents');
      if (!eventInfo.openGraphImage) {
        await queryInterface.addColumn(
          'CalendarEvents',
          'openGraphImage',
          Sequelize.STRING,
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
      await queryInterface.removeColumn('CompetitionUnits', 'openGraphImage', {
        transaction,
      });
      await queryInterface.removeColumn('CompetitionUnits', 'openGraphImage', {
        transaction,
      });
    });
  },
};
