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
      if (!compInfo.isOpen) {
        await queryInterface.addColumn(
          'CompetitionUnits',
          'isOpen',
          Sequelize.BOOLEAN,
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
      await queryInterface.removeColumn('CompetitionUnits', 'isOpen', {
        transaction,
      });
    });
  },
};
