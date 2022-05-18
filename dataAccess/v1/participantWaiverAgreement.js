const db = require('../../index');

exports.insert = async (
  { participantId, waiverType, agreedAt },
  transaction,
) => {
  const result = await db.ParticipantWaiverAgreement.create(
    {
      participantId,
      waiverType,
      agreedAt,
    },
    { transaction },
  );

  return result;
};

exports.getByParticipant = async (participantId) => {
  const result = await db.ParticipantWaiverAgreement.findAll({
    where: {
      participantId,
    },
  });

  return result;
};

exports.deleteByEventAndType = async (
  { calendarEventId, waiverTypes },
  transaction,
) => {
  const deletedCount = await db.ParticipantWaiverAgreement.delete({
    where: {
      calendarEventId,
      waiverType: {
        [db.Op.in]: waiverTypes,
      },
    },
    transaction,
  });

  return deletedCount;
};
