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

exports.deleteByDocument = async (documentId, transaction) => {
  const deletedCount = await db.ParticipantDocumentAgreement.destroy({
    where: {
      documentId,
    },
    transaction,
  });

  return deletedCount;
};

exports.deleteByParticipant = async (participantId, transaction) => {
  const deletedCount = await db.ParticipantDocumentAgreement.destroy({
    where: {
      participantId,
    },
    transaction,
  });

  return deletedCount;
};
