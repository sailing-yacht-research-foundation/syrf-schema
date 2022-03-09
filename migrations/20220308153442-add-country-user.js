'use strict';

const tableName = 'UserProfiles';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);
      if (table.locale) {
        await queryInterface.renameColumn(tableName, 'locale', 'country', {
          transaction,
        });
      }
      if (!table.language) {
        await queryInterface.addColumn(
          tableName,
          'language',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            defaultValue: 'en',
          },
          { transaction },
        );
      }
      if (!table.lastLocation) {
        await queryInterface.addColumn(
          tableName,
          'lastLocation',
          {
            type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'lastLocation', {
        transaction,
      });
      await queryInterface.removeColumn(tableName, 'language', {
        transaction,
      });
      await queryInterface.renameColumn(tableName, 'country', 'locale', {
        transaction,
      });
    });
  },
};
