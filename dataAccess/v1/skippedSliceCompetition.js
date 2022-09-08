const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.SkippedSliceCompetition.create(data, {
    validate: true,
    transaction,
  });
};

exports.checkSkippedCompetition = async (competitionUnitId) => {
  const data = await db.SkippedSliceCompetition.findOne({
    where: {
      competitionUnitId,
    },
  });
  return !!data;
};
