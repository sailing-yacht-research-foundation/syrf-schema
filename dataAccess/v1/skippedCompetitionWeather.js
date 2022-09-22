const { competitionUnitStatus, dataSources } = require('../../enums');
const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.SkippedCompetitionWeather.create(data, {
    validate: true,
    transaction,
  });
};

exports.checkSkippedCompetition = async (competitionUnitId) => {
  const data = await db.SkippedCompetitionWeather.findOne({
    where: {
      competitionUnitId,
    },
  });
  return !!data;
};

exports.getUnskippedUnslicedCompetition = async (limit) => {
  const nonSlicedCompetitions = await db.CompetitionUnit.findAll({
    attributes: [
      'id',
      'startTime',
      'endTime',
      'boundingBox',
      [
        db.sequelize.fn('count', db.sequelize.col('"slicedWeathers"."id"')),
        'slicedCount',
      ],
    ],
    // By default ignore all that is un-sliceable (no bounding box, no start time, no end time)
    where: {
      status: competitionUnitStatus.COMPLETED,
      startTime: {
        [db.Op.ne]: null,
      },
      endTime: {
        [db.Op.ne]: null,
      },
      boundingBox: {
        [db.Op.ne]: null,
      },
    },
    include: [
      {
        model: db.SlicedWeather,
        as: 'slicedWeathers',
        attributes: [],
        required: false,
      },
      {
        model: db.CalendarEvent,
        as: 'calendarEvent',
        attributes: ['source'],
        required: true,
        where: {
          source: {
            [db.Op.ne]: dataSources.IMPORT,
          },
        },
      },
      {
        model: db.SkippedCompetitionWeather,
        as: 'skippedWeathers',
        attributes: ['competitionUnitId'],
        required: false,
      },
    ],
    subQuery: false,
    group: [
      '"CompetitionUnit"."id"',
      '"CompetitionUnit"."startTime"',
      '"CompetitionUnit"."endTime"',
      '"CompetitionUnit"."boundingBox"',
      '"skippedWeathers"."competitionUnitId"',
      '"calendarEvent"."source"',
    ],
    having: {
      [db.Op.and]: [
        db.sequelize.literal('count("slicedWeathers"."id") = 0'),
        db.sequelize.literal(
          'count("skippedWeathers"."competitionUnitId") = 0',
        ),
      ],
    },
    limit,
    // Need to use raw, otherwise the skippedWeathers ID is always included. Also for calendarevent
    // https://stackoverflow.com/questions/48922551/sequelize-orm-add-primary-key-column-in-selection-while-i-excluded-it
    raw: true,
  });
  return nonSlicedCompetitions;
};
