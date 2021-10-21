const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class GroupMember extends ModelBase {
  static associate(models) {
    this.belongsTo(models.Group, {
      as: 'group',
      constraints: false,
      foreignKey: 'groupId',
      onDelete: 'cascade',
    });
    this.belongsTo(models.UserProfile, {
      as: 'member',
      constraints: false,
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
        allowNull: false,
      },
    },
    {
      modelName: 'GroupMember',
      sequelize,
    },
  );
  return GroupMember;
};
