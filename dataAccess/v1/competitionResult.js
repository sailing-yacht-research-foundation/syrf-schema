const db = require('../../index');

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.CompetitionResult.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};
