const { DataTypes } = require('sequelize');
const GeometryBase = require('./GeometryBase');

class CourseUnsequencedUntimedGeometry extends GeometryBase {
  static associate(models) {
    this.belongsTo(models.Course, {
      as: 'course',
      foreignKey: 'courseId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  CourseUnsequencedUntimedGeometry.initGeometry(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      modelName: 'CourseUnsequencedUntimedGeometry',
      sequelize,
    },
  );
  return CourseUnsequencedUntimedGeometry;
};
