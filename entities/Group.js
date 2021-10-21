const { DataTypes } = require('sequelize');
const { groupVisibilities } = require('../enums');
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
  for (const [key, _value] of Object.entries(groupVisibilities)) {
    visibilityEnums.push(key);
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
        type: DataTypes.STRING,
      },
      visibility: {
        type: DataTypes.ENUM(visibilityEnums),
        allowNull: false,
      },
    },
    {
      modelName: 'Group',
      sequelize,
    },
  );
  return Group;
};
