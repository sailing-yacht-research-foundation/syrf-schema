'use strict';

const { followerStatus } = require('../enums');

const followerTableName = 'UserFollowers';
const userTableName = 'UserProfiles';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(followerTableName);
      } catch (err) {
        tableInfo = null;
      }

      if (!tableInfo) {
        await queryInterface.createTable(
          followerTableName,
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
            followerId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            status: {
              type: Sequelize.DataTypes.ENUM(Object.values(followerStatus)),
              allowNull: false,
              defaultValue: followerStatus.requested,
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

      if (!userTable.isPrivate) {
        await queryInterface.addColumn(
          userTableName,
          'isPrivate',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          { transaction },
        );
      }
      if (!userTable.bio) {
        await queryInterface.addColumn(
          userTableName,
          'bio',
          {
            type: Sequelize.STRING,
          },
          { transaction },
        );
      }
      if (!userTable.sailingNumber) {
        await queryInterface.addColumn(
          userTableName,
          'sailingNumber',
          {
            type: Sequelize.STRING,
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
        tableInfo = await queryInterface.describeTable(followerTableName);
      } catch (err) {
        tableInfo = null;
      }

      if (tableInfo) {
        await queryInterface.dropTable(followerTableName, {
          transaction,
        });
      }

      const userTable = await queryInterface.describeTable(userTableName);
      if (userTable.isPrivate) {
        await queryInterface.removeColumn(userTableName, 'isPrivate', {
          transaction,
        });
      }
      if (userTable.bio) {
        await queryInterface.removeColumn(userTableName, 'bio', {
          transaction,
        });
      }
      if (userTable.sailingNumber) {
        await queryInterface.removeColumn(userTableName, 'sailingNumber', {
          transaction,
        });
      }
    });
  },
};
