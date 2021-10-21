'use strict';

const { groupVisibilities, groupMemberStatus } = require('../enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const visibilityEnums = [];
    // eslint-disable-next-line no-unused-vars
    for (const [key, _value] of Object.entries(groupVisibilities)) {
      visibilityEnums.push(key);
    }

    await queryInterface.createTable('Groups', {
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
        type: Sequelize.DataTypes.STRING,
      },
      visibility: {
        type: Sequelize.DataTypes.ENUM(visibilityEnums),
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
    });

    await queryInterface.createTable('GroupMembers', {
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
        type: Sequelize.DataTypes.STRING,
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
    });
  },

  down: async (queryInterface) => {
    queryInterface.dropTable('GroupMembers');
    queryInterface.dropTable('Groups');
  },
};
