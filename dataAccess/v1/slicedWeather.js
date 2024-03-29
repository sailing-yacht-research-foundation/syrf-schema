const db = require('../../index');

exports.bulkInsert = async (data, transaction) => {
  const result = await db.SlicedWeather.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.findExistingSlices = async ({
  competitionUnitId,
  originalFileId,
  fileType,
}) => {
  const result = await db.SlicedWeather.findAll({
    where: Object.assign(
      {
        competitionUnitId,
        originalFileId,
      },
      fileType ? { fileType } : {},
    ),
  });
  return result;
};

exports.findByCompetition = async (competitionUnitId, fileType) => {
  const result = await db.SlicedWeather.findAll({
    where: Object.assign(
      {
        competitionUnitId,
      },
      fileType ? { fileType } : {},
    ),
    raw: true,
  });
  return result;
};

exports.findById = async (id) => {
  const result = await db.SlicedWeather.findByPk(id, {
    include: [
      {
        model: db.CompetitionUnit,
        as: 'competitionUnit',
        attributes: ['createdById'],
        required: true,
        include: [
          {
            as: 'calendarEvent',
            model: db.CalendarEvent,
            attributes: ['isPrivate', 'status'],
          },
        ],
      },
    ],
  });
  return result?.toJSON();
};

exports.findWithPaging = async (
  paging,
  { competitionUnitId, fileType, model },
) => {
  const result = await db.SlicedWeather.findAllWithPaging(
    {
      where: Object.assign(
        {
          competitionUnitId,
        },
        fileType ? { fileType } : {},
        model
          ? {
              model: {
                [db.Op.in]: model,
              },
            }
          : {},
      ),
    },
    { ...paging, defaultSort: [['sliceDate', 'DESC']] },
  );
  return result;
};
