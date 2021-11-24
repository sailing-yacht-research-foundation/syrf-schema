const uuid = require('uuid');
const db = require('../../index');
const { includeMeta, getMeta } = require('../../utils/utils');
const { geometryType } = require('../../enums');

const include = [
  {
    as: 'competitionUnit',
    model: db.CompetitionUnit,
    attributes: ['id', 'name'],
  },
  {
    as: 'courseSequencedGeometries',
    model: db.CourseSequencedGeometry,
    include: [
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
    ],
  },
  {
    as: 'courseUnsequencedUntimedGeometry',
    model: db.CourseUnsequencedUntimedGeometry,
    include: [
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
    ],
  },
  {
    as: 'courseUnsequencedTimedGeometry',
    model: db.CourseUnsequencedTimedGeometry,
    include: [
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
    ],
  },
  {
    model: db.CalendarEvent,
    attributes: ['id', 'name'],
    as: 'event',
    include: [
      {
        model: db.UserProfile,
        as: 'editors',
        attributes: ['id', 'name'],
        through: {
          attributes: [],
        },
      },
      {
        model: db.UserProfile,
        as: 'owner',
        attributes: ['id', 'name'],
      },
    ],
  },
  ...includeMeta,
];

const mapGeometries = (courseId, meta) => (t) => {
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
    ...meta,
    coordinates,
    id: t.id || uuid.v4(),
    courseId: courseId,
  };
};

const setSequencedGeometries = (
  geometries = [],
  courseId,
  meta,
  transaction,
) => {
  return db.CourseSequencedGeometry.bulkCreate(
    geometries.map(mapGeometries(courseId, meta)),
    { transaction },
  );
};

const setUntimedGeometries = (geometries = [], courseId, meta, transaction) => {
  return db.CourseUnsequencedUntimedGeometry.bulkCreate(
    geometries.map(mapGeometries(courseId, meta)),
    { transaction },
  );
};

const setTimedGeometries = (geometries = [], courseId, meta, transaction) => {
  return db.CourseUnsequencedTimedGeometry.bulkCreate(
    geometries.map(mapGeometries(courseId, meta)),
    { transaction },
  );
};

const clearGeometries = async (
  courseId,
  clearPoint = true,
  transaction = null,
) => {
  courseId = Array.isArray(courseId) ? courseId : [courseId];
  const queryParam = {
    where: {
      courseId: { [db.Op.in]: courseId },
    },
    attributes: ['id'],
    transaction,
  };

  const geometryIds = !clearPoint
    ? []
    : (
        await Promise.all([
          db.CourseSequencedGeometry.findAll(queryParam),
          db.CourseUnsequencedTimedGeometry.findAll(queryParam),
          db.CourseUnsequencedUntimedGeometry.findAll(queryParam),
        ])
      )
        .flat(1)
        .map((t) => t.id);

  const task = [
    db.CourseSequencedGeometry.destroy({
      where: {
        courseId: { [db.Op.in]: courseId },
      },
      transaction,
    }),
    db.CourseUnsequencedTimedGeometry.destroy({
      where: {
        courseId: { [db.Op.in]: courseId },
      },
      transaction,
    }),
    db.CourseUnsequencedUntimedGeometry.destroy({
      where: {
        courseId: { [db.Op.in]: courseId },
      },
      transaction,
    }),
  ];

  task.push(
    db.CoursePoint.destroy({
      where: {
        geometryId: {
          [db.Op.in]: geometryIds,
        },
      },
    }),
  );
  return await Promise.all(task);
};

exports.upsert = async (id, data = {}, transaction) => {
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
    clearGeometries(id, transaction),
  ]);

  const task = [];

  const meta = getMeta(data);

  if (Array.isArray(data.courseSequencedGeometries)) {
    task.push(
      setSequencedGeometries(
        data.courseSequencedGeometries,
        id,
        meta,
        transaction,
      ),
    );
  }

  if (Array.isArray(data.courseUnsequencedUntimedGeometry)) {
    task.push(
      setUntimedGeometries(
        data.courseUnsequencedUntimedGeometry,
        id,
        meta,
        transaction,
      ),
    );
  }

  if (Array.isArray(data.courseSequencedGeometries)) {
    task.push(
      setTimedGeometries(
        data.courseUnsequencedTimedGeometry,
        id,
        meta,
        transaction,
      ),
    );
  }

  if (task.length > 0) await Promise.all(task);

  return {
    ...data,
    ...result?.toJSON(),
  };
};

exports.getAll = async (paging, calendarEventId) => {
  let where = {};

  if (calendarEventId) where.calendarEventId = calendarEventId;

  const result = await db.Course.findAllWithPaging(
    {
      where,
      include: [
        {
          as: 'event',
          model: db.CalendarEvent,
          attributes: ['id', 'name'],
        },
      ],
    },
    paging,
  );
  return result;
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

exports.getById = async (id, transaction) => {
  const result = (
    await db.Course.findByPk(id, {
      include,
      transaction,
    })
  )?.toJSON();

  if (result)
    return {
      ...result,
      courseSequencedGeometries: mapGeometryResponse(
        result.courseSequencedGeometries,
      ),
      courseUnsequencedUntimedGeometry: mapGeometryResponse(
        result.courseUnsequencedUntimedGeometry,
      ),
      courseUnsequencedTimedGeometry: mapGeometryResponse(
        result.courseUnsequencedTimedGeometry,
      ),
    };
  else return result;
};

exports.getByCompetitionId = async (competitionUnitId, transaction) => {
  const result = (
    await db.CompetitionUnit.findByPk(competitionUnitId, {
      attributes: ['id'],
      include: [
        {
          model: db.Course,
          as: 'course',
          include: [
            {
              as: 'courseSequencedGeometries',
              model: db.CourseSequencedGeometry,
            },
            {
              as: 'courseUnsequencedUntimedGeometry',
              model: db.CourseUnsequencedUntimedGeometry,
            },
            {
              as: 'courseUnsequencedTimedGeometry',
              model: db.CourseUnsequencedTimedGeometry,
            },
            ...includeMeta,
          ],
        },
      ],
      transaction,
    })
  ).toJSON()?.course;

  if (result)
    return {
      ...result,
      courseSequencedGeometries: mapGeometryResponse(
        result.courseSequencedGeometries,
      ),
      courseUnsequencedUntimedGeometry: mapGeometryResponse(
        result.courseUnsequencedUntimedGeometry,
      ),
      courseUnsequencedTimedGeometry: mapGeometryResponse(
        result.courseUnsequencedTimedGeometry,
      ),
    };
  else return result;
};

exports.delete = async (id, transaction) => {
  let data = null;
  let isMultiple = Array.isArray(id);

  if (!isMultiple) {
    data = await await db.Course.findByPk(id, {
      include,
      transaction,
    });
    id = [id];
  }
  const [count] = await Promise.all([
    db.Course.destroy({
      where: {
        id: {
          [db.Op.in]: id,
        },
      },
      transaction,
    }),
    db.CompetitionUnit.update(
      { courseId: null },
      {
        where: {
          courseId: {
            [db.Op.in]: id,
          },
        },
        transaction,
      },
    ),
    clearGeometries(id, true, transaction),
  ]);

  return !isMultiple ? data?.toJSON() : count;
};

exports.clear = async () => {
  await db.Course.destroy({
    truncate: true,
    cascade: true,
    force: true,
  });
};

exports.clearPoints = async (geometryIds = [], transaction) => {
  await db.CoursePoint.destroy({
    where: {
      geometryId: { [db.Op.in]: geometryIds },
    },
    transaction,
  });
};

exports.bulkInsertPoints = async (points = [], transaction) => {
  return await db.CoursePoint.bulkCreate(points, { transaction });
};

exports.getCourseCompetitionIds = async (courseId) => {
  const result = await db.CompetitionUnit.findAll({
    where: {
      courseId,
    },
    attributes: {
      include: ['id'],
    },
    raw: true,
  });
  return result.map((row) => {
    return row.id;
  });
};
