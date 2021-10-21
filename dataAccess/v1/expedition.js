const uuid = require('uuid');
const db = require('../../index');
const { includeMeta, excludeMeta } = require('../../utils');

let competitionUnitIPs = [];
let startLinePoints = [];
let points = [];
let pointLastKnownPosition = new Map();

const courseInclude = [
  {
    as: 'courseSequencedGeometries',
    model: db.CourseSequencedGeometry,
    include: [
      {
        as: 'points',
        model: db.CoursePoint,
        attributes: ['id', 'position', 'order', 'properties', 'markTrackerId'],
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
    model: db.CalenderEvent,
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

const include = [
  {
    model: db.CompetitionUnit,
    as: 'competitionUnit',
    attributes: {
      exclude: excludeMeta,
    },
  },
  ...includeMeta,
];

exports.addIPToCache = async (data) => {
  const cacheindex = competitionUnitIPs.findIndex(
    (t) =>
      t.userProfileId === data.userProfileId && t.ipAddress === data.ipAddress,
  );

  if (cacheindex < 0) {
    competitionUnitIPs.push(data);
  } else {
    competitionUnitIPs[cacheindex] = data;
  }
};

exports.upsert = async (data, transaction) => {
  await db.ExpeditionSubscription.destroy({
    where: {
      userProfileId: data.userProfileId,
      ipAddress: data.ipAddress,
    },
  });

  const result = await db.ExpeditionSubscription.create(
    {
      id: uuid.v4(),
      ...data,
    },
    { transaction },
  );

  return result?.toJSON();
};

exports.getAllByUser = async (userId, paging = {}) => {
  const result = await db.ExpeditionSubscription.findAllWithPaging(
    {
      where: {
        userProfileId: userId,
      },
      include,
    },
    paging,
  );

  return result;
};

exports.getById = async (id) => {
  const result = await db.ExpeditionSubscription.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.getCompetitionUnitById = async (id) => {
  const result = await db.CompetitionUnit.findByPk(id, {
    include: [
      {
        model: db.CalenderEvent,
        as: 'calendarEvent',
        attributes: ['id', 'name', 'isPrivate'],
      },
    ],
  });

  return result?.toJSON();
};

exports.getCourseDetail = async (id) => {
  const result = await db.Course.findByPk(id, {
    include: courseInclude,
  });

  return result?.toJSON();
};

exports.upsertCoursePoints = async (data = [], competitionUnitId) => {
  for (let index = 0; index < data.length; index++) {
    const point = data[index];

    const cacheindex = points.findIndex((t) => t.id === point.id);

    if (cacheindex < 0) {
      points.push({ ...point, competitionUnitId });
    }
  }
};

exports.upsertStartLinePoints = async (data = [], competitionUnitId) => {
  for (let index = 0; index < data.length; index++) {
    const point = data[index];

    const cacheindex = startLinePoints.findIndex((t) => t.id === point.id);

    if (cacheindex < 0) {
      startLinePoints.push({ ...point, competitionUnitId });
    }
  }
};

exports.getPointLastKnownPosition = async (id) => {
  return pointLastKnownPosition.get(id);
};

exports.setPointLastKnownPosition = async (id, position = []) => {
  return pointLastKnownPosition.set(id, position);
};

exports.updateReplyPort = async (ip, port, transaction) => {
  const result = await db.ExpeditionSubscription.update(
    {
      replyPort: port,
    },
    {
      where: {
        ipAddress: ip,
      },
      transaction,
    },
  );

  return result;
};
