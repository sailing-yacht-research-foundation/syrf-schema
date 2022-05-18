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

exports.deleteByParticipantAndType = async (
  { participantIds, waiverTypes },
  transaction,
) => {
  const deletedCount = await db.ParticipantWaiverAgreement.destroy({
    where: {
      participantId: {
        [db.Op.in]: participantIds,
      },
      waiverType: {
        [db.Op.in]: waiverTypes,
      },
    },
    transaction,
  });

  return deletedCount;
};

exports.deleteByParticipant = async (participantId, transaction) => {
  const deletedCount = await db.ParticipantWaiverAgreement.destroy({
    where: {
      participantId,
    },
    transaction,
  });

  return deletedCount;
};
