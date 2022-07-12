const db = require('../../index');

var markTrackerActivePoints = [];

exports.pushTrackerPoints = async (point, competitionUnitId) => {
  let index = markTrackerActivePoints.findIndex(
    (t) => t.id === point.id && t.competitionUnitId === competitionUnitId,
  );

  if (index > -1) {
    markTrackerActivePoints[index] = { ...point, competitionUnitId };
  } else {
    markTrackerActivePoints.push({ ...point, competitionUnitId });
  }
};

exports.removeTrackerPoints = async (competitionUnitId) => {
  markTrackerActivePoints = markTrackerActivePoints.filter(
    (t) => t.competitionUnitId !== competitionUnitId,
  );
};

exports.removeTrackerPointsByCompetitionUnits = async (
  competitionUnitIds = [],
) => {
  markTrackerActivePoints = markTrackerActivePoints.filter(
    (t) => !competitionUnitIds.includes(t.competitionUnitId),
  );
};

exports.getById = async (markTrackerId) => {
  return markTrackerActivePoints.filter(
    (t) => t.markTrackerId === markTrackerId,
  );
};

exports.getAllPoints = async () => {
  return markTrackerActivePoints;
};

exports.validateStreamer = async (userProfileId, markTrackerId) => {
  const result = await db.MarkTracker.findOne({
    where: {
      userProfileId,
      id: markTrackerId,
    },
    include: [
      {
        model: db.CoursePoint,
        as: 'points',
      },
    ],
  });

  return result?.toJSON();
};

exports.getPointsByCourseId = async (courseId) => {
  const pointAttr = ['id', 'properties', 'markTrackerId'];
  const [sequenced, unsequenced, timed] = await Promise.all([
    db.CourseSequencedGeometry.findAll({
      where: {
        courseId,
      },
      raw: true,
      nest: true,
      attributes: ['id'],
      include: [
        {
          as: 'points',
          model: db.CoursePoint,
          attributes: pointAttr,
        },
      ],
    }),
    db.CourseUnsequencedUntimedGeometry.findAll({
      where: {
        courseId,
      },
      raw: true,
      nest: true,
      attributes: ['id'],
      include: [
        {
          as: 'points',
          model: db.CoursePoint,
          attributes: pointAttr,
        },
      ],
    }),
    db.CourseUnsequencedTimedGeometry.findAll({
      where: {
        courseId,
      },
      raw: true,
      nest: true,
      attributes: ['id'],
      include: [
        {
          as: 'points',
          model: db.CoursePoint,
          attributes: pointAttr,
        },
      ],
    }),
  ]);

  return [
    ...sequenced.map((t) => t.points),
    ...unsequenced.map((t) => t.points),
    ...timed.map((t) => t.points),
  ].flat(1);
};
