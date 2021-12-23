const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.ScrapedSuccessfulUrl.create(data, {
    validate: true,
    transaction,
  });
};

exports.getAll = async (source) => {
  return await db.ScrapedSuccessfulUrl.findAll({
    attributes: ['url', 'originalId'],
    raw: true,
    where: {
      source,
    },
  });
}

exports.getByUrl = async (url) => {
  return await db.ScrapedSuccessfulUrl.findAll({
    attributes: ['url', 'originalId'],
    raw: true,
    where: {
      url,
    },
  });
}
