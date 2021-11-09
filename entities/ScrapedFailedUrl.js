const { Model, DataTypes } = require('sequelize');

class ScrapedFailedUrl extends Model {}

module.exports = (sequelize) => {
  ScrapedFailedUrl.init(
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
      error: {
        type: DataTypes.TEXT,
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
      modelName: 'ScrapedFailedUrl',
      sequelize,
      timestamps: false,
    },
  );
  return ScrapedFailedUrl;
};
