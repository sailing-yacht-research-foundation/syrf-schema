const db = require('../../index');
const { dataSources } = require('../../enums');
const Op = db.Op;

exports.create = async (data, transaction) => {
  return await db.ScrapedSuccessfulUrl.create(data, {
    validate: true,
    transaction,
  });
};

exports.getAll = async (source) => {
  return await db.ScrapedSuccessfulUrl.findAll({
    attributes: [db.Sequelize.literal('DISTINCT url'), 'originalId'],
    raw: true,
    where: {
      source,
    },
  });
};

exports.deleteByOriginalId = async ({ source, originalId }, transaction) => {
  await db.ScrapedSuccessfulUrl.destroy({
    where: {
      originalId: {
        [Op.eq]: originalId,
      },
      source: {
        [Op.eq]: source,
      },
    },
    transaction,
  });
};

exports.deleteByUrl = async (url, transaction) => {
  await db.ScrapedSuccessfulUrl.destroy({
    where: {
      url,
    },
    transaction,
  });
};


exports.getLastRacePerScrapedSource = async () => {
  return await db.ScrapedSuccessfulUrl.findAll({
    attributes: [db.Sequelize.literal('DISTINCT ON (source) 1'), 'source', 'url', 'createdAt'], // Add 1 constant to avoid sequelize appending comma on DISTINCT ON
    raw: true,
    where: {
      source: [dataSources.BLUEWATER,
        dataSources.ESTELA,
        dataSources.GEORACING,
        dataSources.GEOVOILE,
        dataSources.ISAIL,
        dataSources.KATTACK,
        dataSources.KWINDOO,
        dataSources.METASAIL,
        dataSources.RACEQS,
        dataSources.TACKTRACKER,
        dataSources.TRACTRAC,
        dataSources.YACHTBOT,
        dataSources.YELLOWBRICK]
    },
    order: [["source"], ["createdAt", "DESC"]]
  });
};
