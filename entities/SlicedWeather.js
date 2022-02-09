const { DataTypes, Model } = require('sequelize');

class SlicedWeather extends Model {}

module.exports = (sequelize) => {
  SlicedWeather.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      model: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      s3Key: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fileType: {
        type: DataTypes.ENUM('GRIB', 'JSON'),
        allowNull: false,
      },
      boundingBox: {
        type: DataTypes.GEOMETRY('POLYGON', 4326),
        allowNull: false,
      },
      levels: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      variables: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      runtimes: {
        type: DataTypes.ARRAY(DataTypes.DATE),
        allowNull: false,
      },
      competitionUnitId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      originalFileId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      sliceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      modelName: 'SlicedWeather',
      sequelize,
      timestamps: false,
    },
  );
  return SlicedWeather;
};
