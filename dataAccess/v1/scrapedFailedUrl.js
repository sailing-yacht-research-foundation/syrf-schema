const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.ScrapedFailedUrl.create(data, {
    validate: true,
    transaction,
  });
};
