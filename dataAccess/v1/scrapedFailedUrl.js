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

exports.getByUrl = async (url) => {
  return await db.ScrapedFailedUrl.findAll({
    // Can't find where this is used, but there's no originalId column, typo?
    // Changing to error
    attributes: ['url', 'error'],
    raw: true,
    where: {
      url,
    },
  });
};
