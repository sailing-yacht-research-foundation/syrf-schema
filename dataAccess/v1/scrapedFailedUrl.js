const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.ScrapedFailedUrl.create(data, {
    validate: true,
    transaction,
  });
};

exports.getAll = async (source) => {
  return await db.ScrapedFailedUrl.findAll({
    attributes: ['url', 'error'],
    raw: true,
    where: {
      source,
    },
  });
};
