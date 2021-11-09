const { Model, DataTypes } = require('sequelize');

class ScrapedSuccessfulUrl extends Model {}

module.exports = (sequelize) => {
  ScrapedSuccessfulUrl.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      modelName: 'ScrapedSuccessfulUrl',
      sequelize,
      timestamps: false,
    },
  );
  return ScrapedSuccessfulUrl;
};
