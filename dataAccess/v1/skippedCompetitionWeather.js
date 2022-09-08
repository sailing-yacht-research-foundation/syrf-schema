const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.SkippedCompetitionWeather.create(data, {
    validate: true,
    transaction,
  });
};

exports.checkSkippedCompetition = async (competitionUnitId) => {
  const data = await db.SkippedCompetitionWeather.findOne({
    where: {
      competitionUnitId,
    },
  });
  return !!data;
};
