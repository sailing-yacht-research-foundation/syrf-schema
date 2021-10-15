const uuid = require('uuid');
const { Op } = require('../../index');
const db = require('../../index');
const { includeMeta } = require('../../utils/utils');

const include = [
  {
    model: db.Vessel,
    as: 'vessel',
    attributes: ['id', 'publicName', 'orcJsonPolars'],
  },
  {
    model: db.UserProfile,
    as: 'editors',
    attributes: ['id', 'name'],
    through: {
      attributes: [],
    },
  },
  {
    model: db.VesselParticipantGroup,
    as: 'group',
    attributes: ['id', 'vesselParticipantGroupId'],
    include: [
      {
        model: db.CalenderEvent,
        attributes: ['id', 'name'],
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
    ],
  },
  {
    model: db.Participant,
    as: 'participants',
    attributes: ['id', 'participantId', 'publicName', 'trackerUrl'],
    through: {
      attributes: [],
    },
  },
  {
    model: db.UserProfile,
    as: 'owner',
    attributes: ['id', 'name'],
  },
  ...includeMeta,
];

exports.upsert = async (id, data = {}, transaction = undefined) => {
  if (!id) id = uuid.v4();

  let options;
  if (transaction) {
    options = { transaction };
  }

  const [result] = await db.VesselParticipant.upsert(
    {
      ...data,
      id,
    },
    options,
  );

  return result?.toJSON();
};

exports.getAll = async (paging, vpgId) => {
  let where = {};

  if (paging.query) {
    where.vesselParticipantId = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  if (vpgId) where.vesselParticipantGroupId = vpgId;

  const result = await db.VesselParticipant.findAllWithPaging(
    {
      where,
      include: [
        {
          model: db.Vessel,
          as: 'vessel',
          attributes: [
            'id',
            'publicName',
            'vesselId',
            'globalId',
            'lengthInMeters',
          ],
        },
        {
          model: db.VesselParticipantGroup,
          as: 'group',
          attributes: ['id', 'vesselParticipantGroupId', 'name'],
        },
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
    paging,
  );

  return result;
};

exports.getAllByEvent = async (eventId, pagination) => {
  if (!eventId) return [];

  const result = await db.VesselParticipant.findAllWithPaging(
    {
      include: [
        {
          model: db.Vessel,
          as: 'vessel',
          attributes: [
            'id',
            'publicName',
            'vesselId',
            'globalId',
            'lengthInMeters',
          ],
        },
        {
          model: db.VesselParticipantGroup,
          as: 'group',
          attributes: [
            'id',
            'vesselParticipantGroupId',
            'name',
            'calendarEventId',
          ],
          where: {
            calendarEventId: eventId,
          },
        },
        {
          model: db.Participant,
          as: 'participants',
          through: {
            attributes: [],
          },
          attributes: ['id', 'participantId', 'publicName', 'trackerUrl'],
        },
      ],
    },
    pagination,
  );

  return result;
};

exports.getByGroupParticipant = async (
  vesselParticipantGroupId,
  participantId,
) => {
  const crew = await db.VesselParticipantCrew.findOne({
    where: {
      participantId,
    },
    attributes: ['id', 'vesselParticipantId'],
  });
  if (!crew) {
    return null;
  }
  const result = await db.VesselParticipant.findOne({
    where: {
      id: crew.vesselParticipantId,
      vesselParticipantGroupId,
    },
  });
  return result;
};

exports.getAllByVpg = async (vpgId) => {
  if (!vpgId) return [];
  const result = await db.VesselParticipant.findAll({
    where: {
      vesselParticipantGroupId: vpgId,
    },
    include: [
      {
        model: db.Vessel,
        as: 'vessel',
        attributes: ['id', 'publicName'],
      },
    ],
  });

  return result;
};

exports.getById = async (id) => {
  const result = await db.VesselParticipant.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.delete = async (id) => {
  const data = await db.VesselParticipant.findByPk(id, {
    include,
  });

  if (data) {
    await Promise.all([
      db.VesselParticipant.destroy({
        where: {
          id: id,
        },
      }),
      db.VesselParticipantCrew.destroy({
        where: {
          vesselParticipantId: id,
        },
      }),
    ]);
  }

  return data?.toJSON();
};

exports.clear = async () => {
  await db.VesselParticipant.destroy({
    truncate: true,
    cascade: true,
    force: true,
  });
};

exports.validateParticipants = async (
  vesselParticipantGroupId,
  id,
  participantIds = [],
) => {
  return await db.VesselParticipant.findAll({
    where: {
      vesselParticipantGroupId,
      id: {
        [Op.ne]: id,
      },
    },
    include: [
      {
        model: db.Participant,
        as: 'participants',
        through: {
          attributes: [],
        },
        where: {
          id: {
            [Op.in]: participantIds,
          },
        },
      },
    ],
  });
};

exports.validateVesselIds = async (vesselParticipantGroupId, id, vesselId) => {
  return await db.VesselParticipant.findAll({
    where: {
      id: {
        [Op.ne]: id,
      },
      vesselParticipantGroupId,
      vesselId,
    },
  });
};

exports.getByParticipantAndId = async (
  vesselParticipantId,
  participantIds = [],
) => {
  return (
    await db.VesselParticipant.findOne({
      where: {
        id: vesselParticipantId,
      },
      include: [
        {
          model: db.Participant,
          as: 'participants',
          required: false,
          through: {
            attributes: [],
          },
          where: {
            id: {
              [Op.in]: participantIds,
            },
          },
        },
        {
          model: db.VesselParticipantGroup,
          as: 'group',
          attributes: ['id', 'vesselParticipantGroupId'],
          include: [
            {
              model: db.CalenderEvent,
              attributes: ['id', 'name'],
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
          ],
        },
      ],
    })
  )?.toJSON();
};

exports.addParticipant = async (vesselParticipantId, participantIds = []) => {
  return await db.VesselParticipantCrew.bulkCreate(
    participantIds.map((t) => ({
      vesselParticipantId,
      participantId: t,
    })),
  );
};

exports.removeParticipant = async (vesselParticipantId, participantId) => {
  return await db.VesselParticipantCrew.destroy({
    where: {
      vesselParticipantId,
      participantId,
    },
  });
};