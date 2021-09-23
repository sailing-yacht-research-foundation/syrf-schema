const { DataTypes } = require('sequelize');
const GeometryBase = require('./GeometryBase');

class CourseSequencedGeometry extends GeometryBase {
  static associate(models) {
    this.belongsTo(models.Course, {
      as: 'course',
      foreignKey: 'courseId',
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
    },
    {
      modelName: 'CourseSequencedGeometry',
      sequelize,
    },
  );
  return CourseSequencedGeometry;
};
