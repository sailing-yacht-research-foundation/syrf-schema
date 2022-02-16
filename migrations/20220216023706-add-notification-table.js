'use strict';

const notificationTableName = 'UserNotifications';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(notificationTableName);
      } catch (err) {
        tableInfo = null;
      }

      if (!tableInfo) {
        await queryInterface.createTable(
          notificationTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            userId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            notificationType: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            notificationTitle: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            notificationMessage: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            metadata: {
              type: Sequelize.DataTypes.JSONB,
              allowNull: true,
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            readAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: true,
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
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(notificationTableName);
      } catch (err) {
        tableInfo = null;
      }

      if (tableInfo) {
        await queryInterface.dropTable(notificationTableName, {
          transaction,
        });
      }
    });
  },
};
