const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.ScrapedSuccessfulUrl.create(data, {
    validate: true,
    transaction,
  });
};
