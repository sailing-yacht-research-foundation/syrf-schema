const db = require('../../index');

exports.bulkInsert = async (data, transaction) => {
  const result = await db.SlicedWeather.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.findExistingSlices = async ({ competitionUnitId, originalFileId }) => {
  const result = await db.SlicedWeather.findAll({
    where: {
      competitionUnitId,
      originalFileId,
    },
  });
  return result;
};
