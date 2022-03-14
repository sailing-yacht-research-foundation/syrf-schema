'use strict';

const userSettingTableName = 'UserSettings';
const userTableName = 'UserProfiles';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let userSettingTable;
      try {
        userSettingTable = await queryInterface.describeTable(
          userSettingTableName,
        );
      } catch (err) {
        userSettingTable = null;
      }
      if (!userSettingTable) {
        await queryInterface.createTable(
          userSettingTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
              primaryKey: true,
            },
            emailNotificationSettings: {
              type: Sequelize.DataTypes.JSONB,
              allowNull: false,
            },
            browserNotificationSettings: {
              type: Sequelize.DataTypes.JSONB,
              allowNull: false,
            },
            mobileNotificationSettings: {
              type: Sequelize.DataTypes.JSONB,
              allowNull: false,
            },
            persistentNotificationSettings: {
              type: Sequelize.DataTypes.JSONB,
              allowNull: false,
            },
          },
          {
            transaction,
          },
        );
      }

      const userTable = await queryInterface.describeTable(userTableName);

      if (userTable.optInEmailNotification) {
        await queryInterface.removeColumn(
          userTableName,
          'optInEmailNotification',
          {
            transaction,
          },
        );
      }
      if (userTable.optInMobileNotification) {
        await queryInterface.removeColumn(
          userTableName,
          'optInMobileNotification',
          {
            transaction,
          },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let userSettingTable;
      try {
        userSettingTable = await queryInterface.describeTable(
          userSettingTableName,
        );
      } catch (err) {
        userSettingTable = null;
      }
      if (userSettingTable) {
        await queryInterface.dropTable(userSettingTableName, {
          transaction,
        });
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
    });
  },
};
