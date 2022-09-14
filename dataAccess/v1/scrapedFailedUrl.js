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

exports.getAllWithPaging = async (page = 1, size = 10, { excludeNoPositions = true } = { excludeNoPositions: true }) => {
  const limit = Number(size) || 10;
  let offset = (Number(page) - 1) * limit;
  let where;
  if (!offset || offset < 0) {
    offset = 0;
  }
  if (excludeNoPositions) {
    where = {
        error: {
          [db.Op.and]: {
            [db.Op.notIn]: [
              'Error: No boat positions in race',
              'Error: No positions in race',
              'No positions in race',
              'Error: No divisions in race',
              'Error: No boats in race',
              'No boats in race',
              'No boats in race',
              'Error: No valid race, division or start',
            ],
            [db.Op.notILike]: 'Marked as hidden%',
        },
      }
    };
  }
  return await db.ScrapedFailedUrl.findAll({
    attributes: ["url", "error", "createdAt"],
    raw: true,
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
}
