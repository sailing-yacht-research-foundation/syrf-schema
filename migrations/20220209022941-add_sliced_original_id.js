'use strict';

const tableName = 'SlicedWeathers';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);

      if (!table.originalFileId) {
        await queryInterface.addColumn(
          tableName,
          'originalFileId',
          {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'originalFileId', {
        transaction,
      });
    });
  },
};
