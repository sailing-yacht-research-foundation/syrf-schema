const { DataTypes } = require('sequelize');
const { groupVisibilities, groupTypes } = require('../enums');
const ModelBase = require('../ModelBase');

class Group extends ModelBase {
  static associateBase() {}
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
        type: DataTypes.ENUM(Object.values(groupTypes)),
      },
      visibility: {
        type: DataTypes.ENUM(Object.values(groupVisibilities)),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      createdById: {
        type: DataTypes.UUID,
      },
    },
    {
      modelName: 'Group',
      sequelize,
    },
  );
  return Group;
};
