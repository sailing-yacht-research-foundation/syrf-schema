'use strict';

const userSettingTableName = 'UserSettings';

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
    });
  },

  down: async (queryInterface) => {
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
    });
  },
};
