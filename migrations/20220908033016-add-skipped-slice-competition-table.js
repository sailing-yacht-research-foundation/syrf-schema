'use strict';

const tableName = 'SkippedCompetitionWeathers';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let table;
      try {
        table = await queryInterface.describeTable(tableName);
      } catch (err) {
        table = null;
      }
      if (!table) {
        await queryInterface.createTable(
          tableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            competitionUnitId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            totalFileCount: {
              type: Sequelize.DataTypes.INTEGER,
              allowNull: false,
            },
            message: {
              type: Sequelize.DataTypes.TEXT,
              allowNull: false,
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
              defaultValue: Sequelize.DataTypes.NOW,
            },
          },
          {
            transaction,
          },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let table;
      try {
        table = await queryInterface.describeTable(tableName);
      } catch (err) {
        table = null;
      }
      if (table) {
        await queryInterface.dropTable(tableName, {
          transaction,
        });
      }
    });
  },
};
