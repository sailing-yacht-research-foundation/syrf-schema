const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class CoursePoint extends ModelBase {
  static associate(models) {
    this.belongsTo(models.CourseSequencedGeometry, {
      as: 'sequenced',
      foreignKey: 'geometryId',
      constraints: false,
    });

    this.belongsTo(models.CourseUnsequencedTimedGeometry, {
      as: 'timed',
      foreignKey: 'geometryId',
      constraints: false,
    });

    this.belongsTo(models.CourseUnsequencedUntimedGeometry, {
      as: 'unsequenced',
      foreignKey: 'geometryId',
      constraints: false,
    });

    this.belongsTo(models.MarkTracker, {
      as: 'tracker',
      foreignKey: 'markTrackerId',
      constraints: false,
    });
  }
}

module.exports = (sequelize) => {
  CoursePoint.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      position: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
      order: {
        type: DataTypes.INTEGER,
      },
      properties: {
        type: DataTypes.JSON,
      },
    },
    {
      modelName: 'CoursePoint',
      sequelize,
    },
  );
  return CoursePoint;
};
