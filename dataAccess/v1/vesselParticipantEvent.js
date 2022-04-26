const db = require('../../index');

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.VesselParticipantEvent.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.getByCompetition = async ({ competitionUnitId, eventType }) => {
  const result = await db.VesselParticipantEvent.findAll({
    where: Object.assign(
      {},
      {
        competitionUnitId,
      },
      eventType
        ? {
            eventType,
          }
        : {},
    ),
  });
  return result;
};
