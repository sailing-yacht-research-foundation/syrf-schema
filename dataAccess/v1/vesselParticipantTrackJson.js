const db = require('../../index');

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.VesselParticipantTrackJson.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.getByCompetitionAndVP = async (
  competitionUnitId,
  vesselParticipantId,
) => {
  const result = await db.VesselParticipantTrackJson.findOne({
    where: {
      competitionUnitId,
      vesselParticipantId,
    },
    include: [
      {
        as: 'vesselParticipant',
        model: db.VesselParticipant,
        attributes: ['vesselParticipantGroupId'],
      },
    ],
  });
  return result?.toJSON();
};
