'use strict';

const { groupVisibilities, groupInvitationStatus } = require('../enums');

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
    });

    await queryInterface.createTable('GroupInvitations', {
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
        allowNull: false,
        onDelete: 'CASCADE',
        references: {
          model: {
            tableName: 'UserProfiles',
          },
          key: 'id',
        },
      },
      invitationDate: {
        type: Sequelize.DataTypes.DATE,
      },
      invitorId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: groupInvitationStatus.pending,
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
        allowNull: false,
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
      invitationId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: true,
        onDelete: 'CASCADE',
        references: {
          model: {
            tableName: 'GroupInvitations',
          },
          key: 'id',
        },
      },
      isAdmin: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isOwner: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    });
  },

  down: async (queryInterface) => {
    queryInterface.dropTable('GroupMembers');
    queryInterface.dropTable('GroupInvitations');
    queryInterface.dropTable('Groups');
  },
};
