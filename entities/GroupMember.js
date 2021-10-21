const { DataTypes } = require('sequelize');
const { groupMemberStatus } = require('../enums');
const ModelBase = require('../ModelBase');

class GroupMember extends ModelBase {
  static associate(models) {
    this.belongsTo(models.Group, {
      as: 'group',
      foreignKey: 'groupId',
      onDelete: 'cascade',
    });
    this.belongsTo(models.UserProfile, {
      as: 'member',
      foreignKey: 'userId',
      onDelete: 'cascade',
    });
    this.belongsTo(models.GroupInvitation, {
      as: 'invitation',
      foreignKey: 'invitationId',
      onDelete: 'cascade',
    });
  }
}

module.exports = (sequelize) => {
  GroupMember.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      joinDate: {
        type: DataTypes.DATE,
      },
      invitationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: groupMemberStatus.invited,
      },
      invitorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      modelName: 'GroupMember',
      sequelize,
    },
  );
  return GroupMember;
};
