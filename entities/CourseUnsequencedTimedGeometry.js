const { DataTypes } = require('sequelize');
const GeometryBase = require('./GeometryBase');

class CourseUnsequencedTimedGeometry extends GeometryBase {
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
  CourseUnsequencedTimedGeometry.initGeometry(
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
    },
    {
      modelName: 'CourseUnsequencedTimedGeometry',
      sequelize,
    },
  );
  return CourseUnsequencedTimedGeometry;
};
