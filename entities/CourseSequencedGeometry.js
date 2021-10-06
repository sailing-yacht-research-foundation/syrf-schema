const { DataTypes } = require('sequelize');
const GeometryBase = require('./GeometryBase');

class CourseSequencedGeometry extends GeometryBase {
  static associate(models) {
    this.belongsTo(models.Course, {
      as: 'course',
      foreignKey: 'courseId',
      constraints: false,
    });
    this.hasMany(models.CoursePoint, {
      as: 'points',
      foreignKey: 'geometryId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  CourseSequencedGeometry.initGeometry(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      validFrom: {
        type: DataTypes.DATE,
      },
      validTo: {
        type: DataTypes.DATE,
      },
      courseId: {
        type: DataTypes.UUID,
      },
      geometryType: {
        type: DataTypes.STRING,
      },
      order: {
        type: DataTypes.INTEGER,
      },
      coordinates: {
        type: DataTypes.JSON,
      },
      properties: {
        type: DataTypes.JSON,
      },
    },
    {
      modelName: 'CourseSequencedGeometry',
      sequelize,
    },
  );
  return CourseSequencedGeometry;
};
