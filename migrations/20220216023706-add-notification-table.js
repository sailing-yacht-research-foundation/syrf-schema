'use strict';

const notificationTableName = 'UserNotifications';
const userTableName = 'UserProfiles';

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

      const userTable = await queryInterface.describeTable(userTableName);

      if (!userTable.optInEmailNotification) {
        await queryInterface.addColumn(
          userTableName,
          'optInEmailNotification',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
          },
          { transaction },
        );
      }
      if (!userTable.optInMobileNotification) {
        await queryInterface.addColumn(
          userTableName,
          'optInMobileNotification',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
          },
          { transaction },
        );
      }
      if (!userTable.webpushSubscription) {
        await queryInterface.addColumn(
          userTableName,
          'webpushSubscription',
          {
            type: Sequelize.DataTypes.JSON,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!userTable.androidPushSubscription) {
        await queryInterface.addColumn(
          userTableName,
          'androidPushSubscription',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!userTable.iosPushSubscription) {
        await queryInterface.addColumn(
          userTableName,
          'iosPushSubscription',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
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

      await queryInterface.removeColumn(
        userTableName,
        'optInEmailNotification',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        userTableName,
        'optInMobileNotification',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(userTableName, 'webpushSubscription', {
        transaction,
      });
      await queryInterface.removeColumn(
        userTableName,
        'androidPushSubscription',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(userTableName, 'iosPushSubscription', {
        transaction,
      });
    });
  },
};
