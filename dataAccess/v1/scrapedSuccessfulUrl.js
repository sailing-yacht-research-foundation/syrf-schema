const db = require('../../index');
const Op = db.Op;

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

exports.deleteByOriginalId = async ({ source, originalId }, transaction) => {
  await db.ScrapedSuccessfulUrl.destroy({
    where: {
      originalId: {
        [Op.eq]: originalId,
      },
      source: {
        [Op.eq]: source,
      }
    },
    transaction,
  });
}