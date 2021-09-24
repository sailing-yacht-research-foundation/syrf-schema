const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class Course extends ModelBase {
  static associate(models) {
    this.belongsTo(models.CalenderEvent, {
      as: 'event',
      foreignKey: 'calendarEventId',
      constraints: false,
    });

    this.hasMany(models.CompetitionUnit, {
      as: 'competitionUnit',
      foreignKey: 'courseId',
      constraints: false,
    });

    this.hasMany(models.CourseSequencedGeometry, {
      as: 'courseSequencedGeometries',
      constraints: false,
      foreignKey: 'courseId',
      onDelete: 'cascade',
    });

    this.hasMany(models.CourseUnsequencedUntimedGeometry, {
      as: 'courseUnsequencedUntimedGeometry',
      constraints: false,
      foreignKey: 'courseId',
      onDelete: 'cascade',
    });

    this.hasMany(models.CourseUnsequencedTimedGeometry, {
      as: 'courseUnsequencedTimedGeometry',
      constraints: false,
      foreignKey: 'courseId',
      onDelete: 'cascade',
    });
  }
}

module.exports = (sequelize) => {
  Course.init(
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
    },
    {
      modelName: 'Course',
      sequelize,
    },
  );
  return Course;
};
