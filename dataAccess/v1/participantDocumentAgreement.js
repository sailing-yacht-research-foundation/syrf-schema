const db = require('../../index');

exports.insert = async ({ participantId, documentId }, transaction) => {
  const result = await db.ParticipantDocumentAgreement.create(
    {
      participantId,
      documentId,
    },
    { transaction },
  );

  return result;
};

exports.getByParticipant = async (participantId) => {
  const result = await db.ParticipantDocumentAgreement.findAll({
    where: {
      participantId,
    },
  });

  return result;
};

exports.getByDocument = async (documentId) => {
  const result = await db.ParticipantDocumentAgreement.findAll({
    where: {
      documentId,
    },
  });

  return result;
};
