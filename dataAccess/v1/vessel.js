const uuid = require('uuid');
const db = require('../../index');
const { includeMeta, emptyPagingResponse } = require('../../utils/utils');

const include = [...includeMeta];

exports.upsert = async (id, data = {}, transaction = undefined) => {
  if (!id) id = uuid.v4();

  let options;
  if (transaction) {
    options = { transaction };
  }
  const [result] = await db.Vessel.upsert(
    {
      ...data,
      id,
    },
    options,
  );

  return result?.toJSON();
};

exports.getAll = async (paging = {}, params) => {
  let where = {};

  if (paging?.filters?.findIndex((t) => t.field === 'scope') < 0) {
    if (params.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

  if (paging.query) {
    where.publicName = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }
  const result = await db.Vessel.findAllWithPaging(
    {
      where,
    },
    paging,
  );

  return result;
};

exports.getById = async (id) => {
  const result = await db.Vessel.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.delete = async (id, transaction) => {
  const data = await db.Vessel.findByPk(id, {
    include,
  });

  if (data) {
    await db.Vessel.destroy({
      where: {
        id: id,
      },
      transaction,
    });
  }

  return data?.toJSON();
};

exports.getAllForEvent = async (userId, eventId, paging = {}) => {
  let where = {
    [db.Op.or]: [
      {
        createdById: userId,
        bulkCreated: false,
      },
      {
        scope: eventId,
      },
    ],
  };

  if (paging.query) {
    where.publicName = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  const result = await db.Vessel.findAllWithPaging(
    {
      where,
    },
    paging,
  );

  return result;
};

exports.getByVesselIdAndSource = async (vesselIds, source) => {
  const where = {
    source,
  };
  if (vesselIds instanceof Array) {
    where.vesselId = {
      [db.Op.in]: vesselIds,
    };
  } else {
    where.vesselId = vesselIds;
  }
  return await db.Vessel.findAll({
    attributes: ['id', 'vesselId'],
    where,
  });
};

exports.getExistingVesselByCalendarEvent = async (calendarEventId) => {
  const vesselParticipantGroups = await db.VesselParticipantGroup.findAll({
    attributes: ['id'],
    include: [
      {
        model: db.VesselParticipant,
        as: 'vesselParticipants',
        attributes: ['id', 'vesselId'],
        required: true,
        include: [
          {
            model: db.Vessel,
            as: 'vessel',
            attributes: ['id', 'vesselId'],
            required: true,
          }
        ]
      },
    ],
    where: { calendarEventId }
  });
  if (!vesselParticipantGroups.length) {
    return [];
  }
  const vessels = [];

  for (const group of vesselParticipantGroups) {
    for (const vesselParticipant of group.vesselParticipants) {
      vessels.push(vesselParticipant.vessel);
    }
  }
  return vessels;
};

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.Vessel.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.bulkCreateWithOptions = async (data, options) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.Vessel.bulkCreate(data, options);
  return result;
};
