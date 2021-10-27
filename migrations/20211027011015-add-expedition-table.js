'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(
          'ExpeditionSubscriptions',
        );
      } catch (err) {
        tableInfo = null;
      }

      if (!tableInfo) {
        await queryInterface.createTable(
          'ExpeditionSubscriptions',
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            ipAddress: {
              type: Sequelize.DataTypes.STRING,
            },
            replyPort: {
              type: Sequelize.DataTypes.INTEGER,
            },
            expiredAt: {
              type: Sequelize.DataTypes.DATE,
            },
            userProfileId: {
              type: Sequelize.DataTypes.UUID,
            },
            competitionUnitId: {
              type: Sequelize.DataTypes.UUID,
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            updatedAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            createdById: {
              type: Sequelize.DataTypes.UUID,
              allowNull: true,
            },
            updatedById: {
              type: Sequelize.DataTypes.UUID,
              allowNull: true,
            },
            developerId: {
              type: Sequelize.DataTypes.UUID,
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
    let tableInfo;
    try {
      tableInfo = await queryInterface.describeTable('ExpeditionSubscriptions');
    } catch (err) {
      tableInfo = null;
    }

    if (tableInfo?.id)
      await queryInterface.dropTable('ExpeditionSubscriptions');
  },
};
