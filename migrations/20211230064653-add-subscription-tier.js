'use strict';

const userTableName = 'UserProfiles';
const subscriptionTableName = 'SubscriptionTiers';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(subscriptionTableName);
      } catch (err) {
        tableInfo = null;
      }

      if (!tableInfo) {
        // TODO: How are we going to scope each tiers capabilities, can we use the existing scope for dev token?
        // Probably not in this ticket, since the scope is for payment
        await queryInterface.createTable(
          subscriptionTableName,
          {
            tierCode: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
              primaryKey: true,
            },
            tierName: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            description: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            stripeProductId: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            updatedAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
          },
          {
            transaction,
          },
        );
      }

      const userTable = await queryInterface.describeTable(userTableName);

      if (!userTable.stripeCustomerId) {
        await queryInterface.addColumn(
          userTableName,
          'stripeCustomerId',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!userTable.stripeSubscriptionId) {
        await queryInterface.addColumn(
          userTableName,
          'stripeSubscriptionId',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!userTable.subscriptionTier) {
        await queryInterface.addColumn(
          userTableName,
          'subscriptionTier',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!userTable.subscriptionExpireDate) {
        await queryInterface.addColumn(
          userTableName,
          'subscriptionExpireDate',
          {
            type: Sequelize.DataTypes.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(userTableName, 'subscriptionTier', {
        transaction,
      });
      await queryInterface.removeColumn(
        userTableName,
        'subscriptionExpireDate',
        {
          transaction,
        },
      );
    });
  },
};
