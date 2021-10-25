'use strict';

const {
  groupVisibilities,
  groupMemberStatus,
  groupTypes,
} = require('../enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Needed, for this error: operator class "gin_trgm_ops" does not exist for access method "gin"
      await queryInterface.sequelize.query(
        'CREATE EXTENSION IF NOT EXISTS pg_trgm',
        {
          transaction,
        },
      );
      await queryInterface.createTable(
        'Groups',
        {
          id: {
            type: Sequelize.DataTypes.UUID,
            defaultValue: Sequelize.DataTypes.UUIDV1,
            allowNull: false,
            primaryKey: true,
          },
          groupName: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
          },
          groupType: {
            type: Sequelize.DataTypes.ENUM(Object.values(groupTypes)),
          },
          visibility: {
            type: Sequelize.DataTypes.ENUM(Object.values(groupVisibilities)),
            allowNull: false,
          },
          description: {
            type: Sequelize.DataTypes.TEXT,
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
        },
        {
          transaction,
        },
      );

      await queryInterface.addIndex('Groups', ['groupName'], {
        unique: false,
        using: 'gin',
        operator: 'gin_trgm_ops',
        transaction,
      });

      await queryInterface.createTable(
        'GroupMembers',
        {
          id: {
            type: Sequelize.DataTypes.UUID,
            defaultValue: Sequelize.DataTypes.UUIDV1,
            allowNull: false,
            primaryKey: true,
          },
          groupId: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
            onDelete: 'CASCADE',
            references: {
              model: {
                tableName: 'Groups',
              },
              key: 'id',
            },
          },
          userId: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
            onDelete: 'CASCADE',
            references: {
              model: {
                tableName: 'UserProfiles',
              },
              key: 'id',
            },
          },
          joinDate: {
            type: Sequelize.DataTypes.DATE,
          },
          isAdmin: {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          email: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
          },
          status: {
            type: Sequelize.DataTypes.ENUM(Object.values(groupMemberStatus)),
            allowNull: false,
            defaultValue: groupMemberStatus.invited,
          },
          invitorId: {
            type: Sequelize.DataTypes.UUID,
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
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('GroupMembers');
    await queryInterface.dropTable('Groups');
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS pg_trgm');
  },
};
