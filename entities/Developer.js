const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class Developer extends ModelBase {
  static associateBase(models) {
    this.belongsTo(models.UserProfile, {
      as: 'createdBy',
      foreignKey: 'createdById',
      constraints: false,
    });
    this.belongsTo(models.UserProfile, {
      as: 'updatedBy',
      foreignKey: 'updatedById',
      constraints: false,
    });
  }
  static associate(models) {
    this.hasOne(models.UserProfile, {
      as: 'userProfile',
      foreignKey: 'developerAccountId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  Developer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      email: {
        unique: true,
        type: DataTypes.STRING,
      },
    },
    {
      modelName: 'Developer',
      sequelize,
    },
  );
  Developer.sync = () => Promise.resolve();
  return Developer;
};
