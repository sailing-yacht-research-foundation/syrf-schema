'use strict';

const tableName = 'UserProfiles';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);

      if (!table.isStreamer) {
        await queryInterface.addColumn(
          tableName,
          'isStreamer',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      if (!table.stripePaymentIntent) {
        await queryInterface.addColumn(
          tableName,
          'stripePaymentIntent',
          {
            type: Sequelize.DataTypes.STRING,
          },
          { transaction },
        );
      }

      if (!table.hasVerifiedStripePayment) {
        await queryInterface.addColumn(
          tableName,
          'hasVerifiedStripePayment',
          {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'isStreamer', {
        transaction,
      });
      await queryInterface.removeColumn(tableName, 'stripePaymentIntent', {
        transaction,
      });
      await queryInterface.removeColumn(tableName, 'hasVerifiedStripePayment', {
        transaction,
      });
    });
  },
};
