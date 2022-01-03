'use strict';

const userTableName = 'UserProfiles';
const subscriptionTableName = 'SubscriptionTiers';
const groupTableName = 'Groups';
const calendarEventTableName = 'CalendarEvents';

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
      if (!userTable.latestInvoice) {
        await queryInterface.addColumn(
          userTableName,
          'latestInvoice',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }

      const groupTable = await queryInterface.describeTable(groupTableName);

      if (!groupTable.stripeConnectedAccountId) {
        await queryInterface.addColumn(
          groupTableName,
          'stripeConnectedAccountId',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!groupTable.stripeChargesEnabled) {
        await queryInterface.addColumn(
          groupTableName,
          'stripeChargesEnabled',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!groupTable.stripePayoutsEnabled) {
        await queryInterface.addColumn(
          groupTableName,
          'stripePayoutsEnabled',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!groupTable.tosAcceptance) {
        await queryInterface.addColumn(
          groupTableName,
          'tosAcceptance',
          {
            type: Sequelize.DataTypes.JSON,
            allowNull: true,
          },
          { transaction },
        );
      }

      const eventTable = await queryInterface.describeTable(
        calendarEventTableName,
      );
      if (!eventTable.organizerGroupId) {
        await queryInterface.addColumn(
          calendarEventTableName,
          'organizerGroupId',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
            comment: 'Group that holds the stripe payouts integration',
          },
          { transaction },
        );
      }
      if (!eventTable.participatingFee) {
        await queryInterface.addColumn(
          calendarEventTableName,
          'participatingFee',
          {
            type: Sequelize.DataTypes.DOUBLE,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!eventTable.stripeProductId) {
        await queryInterface.addColumn(
          calendarEventTableName,
          'stripeProductId',
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }
      if (!eventTable.stripePricingId) {
        await queryInterface.addColumn(
          calendarEventTableName,
          'stripePricingId',
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
      await queryInterface.removeColumn(userTableName, 'subscriptionTier', {
        transaction,
      });
      await queryInterface.removeColumn(userTableName, 'stripeCustomerId', {
        transaction,
      });
      await queryInterface.removeColumn(userTableName, 'stripeSubscriptionId', {
        transaction,
      });
      await queryInterface.removeColumn(
        userTableName,
        'subscriptionExpireDate',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(userTableName, 'latestInvoice', {
        transaction,
      });

      await queryInterface.removeColumn(
        groupTableName,
        'stripeConnectedAccountId',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        groupTableName,
        'stripeChargesEnabled',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        groupTableName,
        'stripePayoutsEnabled',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(groupTableName, 'tosAcceptance', {
        transaction,
      });

      await queryInterface.removeColumn(
        calendarEventTableName,
        'organizerGroupId',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        calendarEventTableName,
        'participatingFee',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        calendarEventTableName,
        'stripeProductId',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        calendarEventTableName,
        'stripePricingId',
        {
          transaction,
        },
      );

      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(subscriptionTableName);
      } catch (err) {
        tableInfo = null;
      }

      if (tableInfo) {
        await queryInterface.dropTable(subscriptionTableName, {
          transaction,
        });
      }
    });
  },
};
