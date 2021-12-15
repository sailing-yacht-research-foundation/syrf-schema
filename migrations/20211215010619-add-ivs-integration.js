'use strict';

const { ivsLatencyMode, ivsTypeEnum } = require('../enums');

const tableName = 'UserStreams';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(tableName);
      } catch (err) {
        tableInfo = null;
      }

      if (!tableInfo) {
        await queryInterface.createTable(
          tableName,
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
            isLive: {
              type: Sequelize.DataTypes.BOOLEAN,
              allowNull: false,
              default: false,
            },
            competitionUnitId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            ivsChannelArn: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            ivsChannelName: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            ivsIngestEndpoint: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            ivsPlaybackUrl: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            streamKeyArn: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            privateStream: {
              type: Sequelize.DataTypes.BOOLEAN,
              allowNull: false,
              default: false,
            },
            latencyMode: {
              type: Sequelize.DataTypes.ENUM(Object.values(ivsLatencyMode)),
              allowNull: false,
              defaultValue: ivsLatencyMode.LOW,
            },
            ivsType: {
              type: Sequelize.DataTypes.ENUM(Object.values(ivsTypeEnum)),
              allowNull: false,
              defaultValue: ivsTypeEnum.STANDARD,
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
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(tableName);
      } catch (err) {
        tableInfo = null;
      }

      if (tableInfo) {
        await queryInterface.dropTable(tableName, {
          transaction,
        });
      }
    });
  },
};
