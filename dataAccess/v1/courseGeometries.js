const uuid = require('uuid');
const db = require('../../index');
const { geometryType } = require('../../enums');

const includePoints = [
  {
    as: 'points',
    model: db.CoursePoint,
    attributes: ['id', 'position', 'order', 'properties', 'markTrackerId'],
    include: [
      {
        as: 'tracker',
        model: db.MarkTracker,
        attributes: [
          'id',
          'name',
          'trackerUrl',
          'calendarEventId',
          'userProfileId',
        ],
      },
    ],
  },
];

const mapGeometries = (courseId) => (t) => {
  let coordinates = [];
  if (Array.isArray(t.coordinates)) {
    switch (true) {
      case t.geometryType.toLowerCase() === geometryType.POLYLINE.toLowerCase():
        coordinates = t.coordinates;
        break;
      case t.geometryType.toLowerCase() === geometryType.POLYGON.toLowerCase():
        coordinates = [t.coordinates];
        break;
      case t.geometryType.toLowerCase() === geometryType.POINT.toLowerCase() &&
        t.coordinates.length > 0:
        coordinates = t.coordinates[0];
        break;

      default:
        coordinates = t.coordinates;
        break;
    }
  } else {
    coordinates = t.coordinates;
  }

  return {
    ...t,
    coordinates,
    id: t.id || uuid.v4(),
    courseId: courseId,
  };
};

const mapGeometryResponse = (obj = []) => {
  return obj.map((t) => {
    let coordinates = [];
    if (Array.isArray(t.coordinates)) {
      switch (true) {
        case t.geometryType.toLowerCase() ===
          geometryType.POLYLINE.toLowerCase():
          coordinates = t.coordinates;
          break;
        case t.geometryType.toLowerCase() ===
          geometryType.POLYGON.toLowerCase() && t.coordinates.length > 0:
          coordinates = t.coordinates[0];
          break;
        case t.geometryType.toLowerCase() === geometryType.POINT.toLowerCase():
          coordinates = [t.coordinates];
          break;

        default:
          coordinates = t.coordinates;
          break;
      }
    } else {
      coordinates = t.coordinates;
    }

    t.points.sort((a, b) => a.order - b.order);

    return {
      ...t,
      points: t.points.map((point) => ({
        ...point,
        position: point.position.coordinates,
      })),
      coordinates,
    };
  });
};

const setSequencedGeometries = async (
  courseId,
  geometries = [],
  transaction,
) => {
  await clearSequenced(courseId, transaction);
  await db.CourseSequencedGeometry.bulkCreate(
    geometries.map(mapGeometries(courseId)),
    { transaction },
  );

  return geometries;
};

exports.setSequencedGeometries = setSequencedGeometries;

const setUnsequencedGeometries = async (
  courseId,
  geometries = [],
  transaction,
) => {
  await clearUnsequenced(courseId, transaction);
  await db.CourseUnsequencedUntimedGeometry.bulkCreate(
    geometries.map(mapGeometries(courseId)),
    { transaction },
  );

  return geometries;
};

exports.setUnsequencedGeometries = setUnsequencedGeometries;

const setTimedGeometries = async (courseId, geometries = [], transaction) => {
  await clearTimed(courseId, transaction);
  await db.CourseUnsequencedTimedGeometry.bulkCreate(
    geometries.map(mapGeometries(courseId)),
    {
      transaction,
    },
  );
};

exports.setTimedGeometries = setTimedGeometries;

const clearSequenced = (courseId, transaction) => {
  return db.CourseSequencedGeometry.destroy({
    where: {
      courseId: courseId,
    },
    transaction,
  });
};

exports.clearSequenced = clearSequenced;

const clearUnsequenced = (courseId, transaction) => {
  return db.CourseUnsequencedUntimedGeometry.destroy({
    where: {
      courseId: courseId,
    },
    transaction,
  });
};

exports.clearUnsequenced = clearUnsequenced;

const clearTimed = (courseId, transaction) => {
  return db.CourseUnsequencedTimedGeometry.destroy({
    where: {
      courseId: courseId,
    },
    transaction,
  });
};

exports.clearTimed = clearTimed;

exports.upsertCourse = async (id, data = {}, transaction) => {
  if (!id) id = uuid.v4();
  const [[result]] = await Promise.all([
    db.Course.upsert(
      {
        ...data,
        id,
      },
      { transaction },
    ),
    db.CompetitionUnit.update(
      { courseId: id },
      {
        where: {
          id: data.competitionUnitId,
        },
        transaction,
      },
    ),
  ]);

  return {
    ...data,
    ...result?.toJSON(),
  };
};

exports.getSequencedByCourseId = async (courseId, transaction) => {
  const result = await db.CourseSequencedGeometry.findAll({
    where: {
      courseId,
    },
    order: [['order', 'ASC']],
    include: includePoints,
    transaction,
  });

  return mapGeometryResponse(result.map((t) => t?.toJSON()));
};

exports.getUnsequencedByCourseId = async (courseId, transaction) => {
  const result = await db.CourseUnsequencedUntimedGeometry.findAll({
    where: {
      courseId,
    },
    include: includePoints,
    transaction,
  });

  return mapGeometryResponse(result.map((t) => t?.toJSON()));
};

exports.getTimedByCourseId = async (courseId, transaction) => {
  const result = await db.CourseUnsequencedTimedGeometry.findAll({
    where: {
      courseId,
    },
    include: includePoints,
    order: [['order', 'ASC']],
    transaction,
  });

  return mapGeometryResponse(result.map((t) => t?.toJSON()));
};

exports.getSequencedByCompetitionId = async (
  competitionUnitId,
  transaction,
) => {
  const result = await db.CourseSequencedGeometry.findAll({
    include: [
      ...includePoints,
      {
        model: db.Course,
        as: 'course',
        attributes: [],
        include: [
          {
            model: db.CompetitionUnit,
            as: 'competitionUnit',
            attributes: [],
            where: {
              id: competitionUnitId,
            },
          },
        ],
      },
    ],
    transaction,
  });

  return mapGeometryResponse(result.map((t) => t?.toJSON()));
};

exports.getUnsequencedByCompetitionId = async (
  competitionUnitId,
  transaction,
) => {
  const result = await db.CourseUnsequencedUntimedGeometry.findAll({
    include: [
      ...includePoints,
      {
        model: db.Course,
        as: 'course',
        attributes: [],
        include: [
          {
            model: db.CompetitionUnit,
            as: 'competitionUnit',
            attributes: [],
            where: {
              id: competitionUnitId,
            },
          },
        ],
      },
    ],
    transaction,
  });

  return mapGeometryResponse(result.map((t) => t?.toJSON()));
};

exports.getTimedByCompetitionId = async (competitionUnitId, transaction) => {
  const result = await db.CourseUnsequencedTimedGeometry.findAll({
    include: [
      ...includePoints,
      {
        model: db.Course,
        as: 'course',
        attributes: [],
        include: [
          {
            model: db.CompetitionUnit,
            as: 'competitionUnit',
            attributes: [],
            where: {
              id: competitionUnitId,
            },
          },
        ],
      },
    ],
    transaction,
  });

  return mapGeometryResponse(result.map((t) => t?.toJSON()));
};

exports.clearPoints = async (geometryIds = [], transaction) => {
  await db.CoursePoint.destroy({
    where: {
      id: geometryIds,
    },
    transaction,
  });
};

exports.bulkInsertPoints = async (points = []) => {
  await db.CoursePoint.bulkCreate(points);
};
