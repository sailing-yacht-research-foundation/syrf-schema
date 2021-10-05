'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const tableInfo = await queryInterface.describeTable('CompetitionUnits');

    if (!tableInfo.isPrivate) {
      await queryInterface.addColumn(
        'CompetitionUnits',
        'openGraphImage',
        Sequelize.STRING,
      );
    }
  },

  down: async (queryInterface) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('CompetitionUnits', 'openGraphImage');
  },
};
