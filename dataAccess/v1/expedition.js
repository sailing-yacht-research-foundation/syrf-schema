const uuid = require('uuid');
const db = require('../../index');
const { includeMeta, excludeMeta } = require('../../utils/utils');
const { competitionUnitStatus } = require('../../enums');

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
    attributes: ['id', 'name', 'status', 'calendarEventId', 'courseId'],
  },
  ...includeMeta,
];

exports.upsert = async (data, transaction) => {
  await db.ExpeditionSubscription.destroy({
    where: {
      userProfileId: data.userProfileId,
      competitionUnitId: data.competitionUnitId,
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

exports.deleteSubscription = async (data, transaction) => {
  const result = await db.ExpeditionSubscription.destroy({
    where: {
      userProfileId: data.userProfileId,
      competitionUnitId: data.competitionUnitId,
    },
    transaction,
  });

  return result;
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

exports.getAllSubs = async () => {
  const result = await db.ExpeditionSubscription.findAll({
    raw: true,
  });
  return result;
};

exports.getAllOngoingCUWithCourse = async () => {
  const result = await db.CompetitionUnit.findAll({
    where: {
      status: competitionUnitStatus.ONGOING,
      courseId: {
        [db.Op.ne]: null,
      },
    },
    raw: true,
  });
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
        attributes: ['id', 'name', 'isPrivate', 'ownerId'],
      },
      {
        model: db.Course,
        as: 'course',
        attributes: ['id', 'name'],
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

exports.updateReplyPort = async (ip, port, transaction) => {
  await db.ExpeditionSubscription.update(
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
};

exports.getExpiredSubscriptions = async (date) => {
  if (!date) date = new Date();

  const result = await db.ExpeditionSubscription.findAll({
    where: {
      expiredAt: {
        [db.Op.lte]: date,
      },
    },
    raw: true,
  });

  return result;
};
