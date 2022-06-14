const db = require('../../index');

exports.getCountByCompetition = async (competitionUnitId) => {
  const statsCount = await db.VesselParticipantTrackMetadata.count({
    where: {
      competitionUnitId,
    },
  });
  return statsCount;
};
