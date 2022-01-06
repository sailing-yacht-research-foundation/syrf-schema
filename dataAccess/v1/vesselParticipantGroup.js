const uuid = require('uuid');
const { Op } = require('../../index');
const db = require('../../index');
const { includeMeta, emptyPagingResponse } = require('../../utils/utils');

const include = [
  {
    model: db.CompetitionUnit,
    as: 'competitionUnit',
    attributes: ['id', 'name'],
  },
  {
    model: db.VesselParticipant,
    attributes: ['id', 'vesselParticipantId'],
    as: 'vesselParticipants',
    include: [
      {
        as: 'vessel',
        model: db.Vessel,
        attributes: ['id', 'publicName'],
        paranoid: false,
      },
    ],
  },
  {
    model: db.CalendarEvent,
    attributes: ['id', 'name', 'isOpen'],
    as: 'event',
    include: [
      {
        model: db.UserProfile,
        as: 'editors',
        attributes: ['id', 'name'],
        through: {
          attributes: [],
        },
      },
      {
        model: db.UserProfile,
        as: 'owner',
        attributes: ['id', 'name'],
      },
    ],
  },
  ...includeMeta,
];

exports.upsert = async (id, data = {}, transaction) => {
  if (!id) id = uuid.v4();

  const [[result]] = await Promise.all([
    db.VesselParticipantGroup.upsert(
      {
        ...data,
        id,
      },
      { transaction },
    ),
  ]);

  return result?.toJSON();
};

exports.getAll = async (paging, params) => {
  let where = {};

  if (params.calendarEventId) {
    where.calendarEventId = params.calendarEventId;
  } else {
    if (params.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

  const result = await db.VesselParticipantGroup.findAllWithPaging(
    {
      where,
      include: [
        {
          as: 'competitionUnit',
          model: db.CompetitionUnit,
          attributes: ['id', 'name'],
        },
      ],
    },
    paging,
  );
  return result;
};

exports.getById = async (id, transaction) => {
  const result = await db.VesselParticipantGroup.findByPk(id, {
    include,
    transaction,
  });

  return result?.toJSON();
};

exports.getByIds = async (id = [], transaction) => {
  if (id.length < 1) return id;

  const result = await db.VesselParticipantGroup.findAll({
    where: {
      id: {
        [db.Op.in]: id,
      },
    },
    raw: true,
    transaction,
  });

  return result;
};

exports.getByCompetitionId = async (competitionUnitId) => {
  const result = await db.VesselParticipantGroup.findOne({
    where: {
      competitionUnitId,
    },
    include,
  });

  return result?.toJSON();
};

exports.delete = async (id, transaction) => {
  let data = null;
  let isMultiple = Array.isArray(id);

  if (!isMultiple) {
    data = await db.VesselParticipantGroup.findByPk(id, {
      include,
      transaction,
    });
    id = [id];
  }

  const [count] = await Promise.all([
    db.VesselParticipantGroup.destroy({
      where: {
        id: {
          [Op.in]: id,
        },
      },
      transaction,
    }),
    db.CompetitionUnit.update(
      { vesselParticipantGroupId: null },
      {
        where: {
          vesselParticipantGroupId: {
            [Op.in]: id,
          },
        },
        transaction,
      },
    ),
  ]);

  return !isMultiple ? data?.toJSON() : count;
};

exports.clear = async () => {
  await db.VesselParticipantGroup.destroy({
    truncate: true,
    cascade: true,
    force: true,
  });
};

exports.getUnregisteredVessel = async (paging, vesselParticipantGroupId) => {
  return await db.Vessel.findAllWithPaging(
    {
      where: {
        publicName: {
          [Op.iLike]: `%${paging.query}%`,
        },
        '$vesselParticipants.vesselId$': {
          [Op.is]: null,
        },
      },
      subQuery: false,
      include: [
        {
          model: db.VesselParticipant,
          as: 'vesselParticipants',
          required: false,
          attributes: [],
          where: {
            vesselParticipantGroupId: {
              [Op.eq]: vesselParticipantGroupId,
            },
          },
        },
      ],
    },
    paging,
  );
};

exports.getUnregisteredParticipants = async (
  paging,
  vesselParticipantGroupId,
) => {
  return await db.Participant.findAllWithPaging(
    {
      where: {
        publicName: {
          [Op.iLike]: `%${paging.query}%`,
        },
        '$vesselParticipants.id$': {
          [Op.is]: null,
        },
      },
      subQuery: false,
      include: [
        {
          model: db.VesselParticipant,
          as: 'vesselParticipants',
          required: false,
          attributes: [],
          where: {
            vesselParticipantGroupId: {
              [Op.eq]: vesselParticipantGroupId,
            },
          },
        },
      ],
    },
    paging,
  );
};
