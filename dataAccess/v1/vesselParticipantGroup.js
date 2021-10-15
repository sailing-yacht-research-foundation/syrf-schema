const uuid = require('uuid');
const { Op } = require('../../index');
const db = require('../../index');
const { includeMeta } = require('../../utils/utils');

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
      },
    ],
  },
  {
    model: db.CalenderEvent,
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

exports.upsert = async (id, data = {}) => {
  if (!id) id = uuid.v4();

  const [[result]] = await Promise.all([
    db.VesselParticipantGroup.upsert({
      ...data,
      id,
    }),
  ]);

  return result?.toJSON();
};

exports.getAll = async (paging, calendarEventId) => {
  let where = {};

  if (calendarEventId) where.calendarEventId = calendarEventId;

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

exports.getById = async (id) => {
  const result = await db.VesselParticipantGroup.findByPk(id, {
    include,
  });

  return result?.toJSON();
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

exports.delete = async (id) => {
  const data = await db.VesselParticipantGroup.findByPk(id, {
    include,
  });

  if (data) {
    await Promise.all([
      db.VesselParticipantGroup.destroy({
        where: {
          id: id,
        },
      }),
      db.CompetitionUnit.update(
        { vesselParticipantGroupId: null },
        {
          where: {
            vesselParticipantGroupId: id,
          },
        },
      ),
    ]);
  }

  return data?.toJSON();
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
