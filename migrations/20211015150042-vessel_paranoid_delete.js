'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Vessels');

    if (!tableInfo.deletedAt)
      await queryInterface.addColumn('Vessels', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('Vessels');

    if (tableInfo.deletedAt)
      await queryInterface.removeColumn('Vessels', 'deletedAt');
  },
};
