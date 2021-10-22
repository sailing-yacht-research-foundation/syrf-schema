const { DataTypes } = require('sequelize');
const { groupMemberStatus } = require('../enums');
const ModelBase = require('../ModelBase');

class GroupMember extends ModelBase {
  static associateBase() {}
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
        allowNull: true,
      },
      joinDate: {
        type: DataTypes.DATE,
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
        type: DataTypes.ENUM(Object.values(groupMemberStatus)),
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
