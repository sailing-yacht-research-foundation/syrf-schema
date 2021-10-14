const db = require('../../index');

var markTrackerActivePoints = [];

exports.pushTrackerPoints = async (point = {}, competitionUnitId) => {
  let index = markTrackerActivePoints.findIndex(
    (t) => t.id === point.id && t.competitionUnitId === competitionUnitId,
  );

  if (index > -1) return;

  markTrackerActivePoints.push({ ...point, competitionUnitId });
};

exports.removeTrackerPoints = async (competitionUnitId) => {
  markTrackerActivePoints = markTrackerActivePoints.filter(
    (t) => t.competitionUnitId !== competitionUnitId,
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

exports.clear = async () => {
  markTrackerActivePoints.clear();
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
