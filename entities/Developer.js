const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class Developer extends ModelBase {}

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
