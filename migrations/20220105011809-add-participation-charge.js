'use strict';

const participationChargeTableName = 'ParticipationCharges';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let participationChargeTable;
      try {
        participationChargeTable = await queryInterface.describeTable(
          participationChargeTableName,
        );
      } catch (err) {
        participationChargeTable = null;
      }

      if (!participationChargeTable) {
        await queryInterface.createTable(
          participationChargeTableName,
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
            calendarEventId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            checkoutSessionId: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            expireDate: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            paymentDate: {
              type: Sequelize.DataTypes.DATE,
              allowNull: true,
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
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let chargeTableInfo;
      try {
        chargeTableInfo = await queryInterface.describeTable(
          participationChargeTableName,
        );
      } catch (err) {
        chargeTableInfo = null;
      }

      if (chargeTableInfo) {
        await queryInterface.dropTable(participationChargeTableName, {
          transaction,
        });
      }
    });
  },
};
