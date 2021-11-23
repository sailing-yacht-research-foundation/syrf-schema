const uuid = require('uuid');
const db = require('../../index');
const { includeMeta } = require('../../utils/utils');

const include = [
  {
    as: 'user',
    model: db.UserProfile,
    attributes: ['id', 'name'],
  },
  ...includeMeta,
];

exports.upsert = async (id, data = {}, transaction) => {
  if (!id) id = uuid.v4();

  const [result] = await db.MarkTracker.upsert({ ...data, id }, { transaction });

  return result?.toJSON();
};

exports.getAll = async (paging, calendarEventId) => {
  let where = {};

  if (paging.query) {
    where.name = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  if (calendarEventId) {
    where.calendarEventId = calendarEventId;
  }

  const result = await db.MarkTracker.findAllWithPaging(
    {
      where,
    },
    paging,
  );
  return result;
};

exports.getById = async (id) => {
  const result = await db.MarkTracker.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.delete = async (id) => {
  const data = await db.MarkTracker.findByPk(id, {
    include,
  });

  if (data) {
    await db.MarkTracker.destroy({
      where: {
        id: id,
      },
    });
  }

  return data?.toJSON();
};

exports.getEvent = async (id) => {
  const result = await db.MarkTracker.findByPk(id, {
    include: [
      {
        model: db.CalendarEvent,
        as: 'event',
      },
    ],
  });

  return result?.toJSON();
};
