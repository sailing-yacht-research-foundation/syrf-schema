const { DataTypes } = require('sequelize');
const { groupVisibilities, groupTypes } = require('../enums');
const ModelBase = require('../ModelBase');

class Group extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.hasMany(models.GroupMember, {
      as: 'groupMember',
      foreignKey: 'groupId',
      constraints: false,
    });

    this.belongsToMany(models.CalenderEvent, {
      through: 'CalendarGroupEditors',
      as: 'calendarEvents',
      constraints: false,
      foreignKey: 'groupId',
      otherKey: 'calendarEventId',
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
