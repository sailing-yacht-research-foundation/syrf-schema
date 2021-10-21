const { DataTypes } = require('sequelize');
const { groupInvitationStatus } = require('../enums');
const ModelBase = require('../ModelBase');

class GroupInvitation extends ModelBase {
  static associate(models) {
    this.belongsTo(models.Group, {
      as: 'group',
      constraints: false,
      foreignKey: 'groupId',
      onDelete: 'cascade',
    });
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'userId',
      onDelete: 'cascade',
    });
  }
}

module.exports = (sequelize) => {
  GroupInvitation.init(
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
      invitationDate: {
        type: DataTypes.DATE,
      },
      invitorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: groupInvitationStatus.pending,
      },
    },
    {
      modelName: 'GroupInvitation',
      sequelize,
    },
  );
  return GroupInvitation;
};
