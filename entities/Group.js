const { DataTypes } = require('sequelize');
const { groupVisibilities, groupTypes } = require('../enums');
const ModelBase = require('../ModelBase');

class Group extends ModelBase {
  static associate(models) {
    this.belongsToMany(models.UserProfile, {
      as: 'members',
      through: models.VesselParticipantCrew,
      foreignKey: 'groupId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  const visibilityEnums = [];
  // eslint-disable-next-line no-unused-vars
  for (const [_key, value] of Object.entries(groupVisibilities)) {
    visibilityEnums.push(value);
  }
  const groupTypeEnums = [];
  // eslint-disable-next-line no-unused-vars
  for (const [_key, value] of Object.entries(groupTypes)) {
    groupTypeEnums.push(value);
  }
  Group.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      groupName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      groupType: {
        type: DataTypes.ENUM(groupTypeEnums),
      },
      visibility: {
        type: DataTypes.ENUM(visibilityEnums),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
    },
    {
      modelName: 'Group',
      sequelize,
    },
  );
  return Group;
};
