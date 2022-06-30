const uuid = require('uuid');
const { Op } = require('../../index');
const db = require('../../index');
const { includeMeta, emptyPagingResponse } = require('../../utils/utils');

const include = [
  {
    model: db.Vessel,
    as: 'vessel',
    attributes: ['id', 'publicName', 'orcJsonPolars'],
    paranoid: false,
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
        model: db.CalendarEvent,
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

exports.getAll = async (paging, params) => {
  let where = {};

  if (paging.query) {
    where.vesselParticipantId = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  if (params?.vesselParticipantGroupId) {
    where.vesselParticipantGroupId = params.vesselParticipantGroupId;
  } else {
    if (params?.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

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
          paranoid: false,
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
          paranoid: false,
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
  const result = await db.VesselParticipantCrew.findOne({
    where: {
      participantId,
    },
    include: {
      model: db.VesselParticipant,
      as: 'vesselParticipant',
      required: true,
      where: {
        vesselParticipantGroupId,
      },
    },
    attributes: ['id', 'vesselParticipantId'],
  });
  return result?.toJSON().vesselParticipant;
};

/**
 *
 * @param {string} vpgId
 * @param {import('../../types/dataAccess').VpGetAllByVpgOption} options
 * @returns
 */
exports.getAllByVpg = async (vpgId, options = {}) => {
  if (!vpgId) return [];
  const result = await db.VesselParticipant.findAll({
    where: {
      vesselParticipantGroupId: vpgId,
    },
    include: [
      {
        model: db.Vessel,
        as: 'vessel',
        attributes: options.vesselAttributes
          ? options.vesselAttributes
          : ['id', 'publicName'],
        paranoid: false,
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

exports.delete = async (id, transaction) => {
  let data = null;
  let isMultiple = Array.isArray(id);

  if (!isMultiple) {
    data = await db.VesselParticipant.findByPk(id, {
      include,
      transaction,
    });
    id = [id];
  }

  let vpc = await db.VesselParticipantCrew.findAll({
    where: {
      vesselParticipantId: {
        [db.Op.in]: id,
      },
    },
    attributes: ['id'],
    transaction,
  });

  const vpcParam = {
    where: {
      vesselParticipantCrewId: {
        [db.Op.in]: vpc.map((t) => t.id),
      },
    },
    transaction,
  };

  const [count] = await Promise.all([
    db.VesselParticipantTrackJson.destroy({
      where: {
        vesselParticipantId: {
          [db.Op.in]: id,
        },
      },
      transaction,
    }),
    db.VesselParticipant.destroy({
      where: {
        id: {
          [db.Op.in]: id,
        },
      },
      transaction,
    }),
    db.VesselParticipantCrew.destroy({
      where: {
        vesselParticipantId: {
          [db.Op.in]: id,
        },
      },
      transaction,
    }),
    db.VesselParticipantCrewTrackJson.destroy(vpcParam),
  ]);

  return !isMultiple ? data?.toJSON() : count;
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

exports.validateVesselIds = async (
  vesselParticipantGroupId,
  id,
  vesselId,
  transaction,
) => {
  return await db.VesselParticipant.findAll({
    where: {
      id: {
        [Op.ne]: id,
      },
      vesselParticipantGroupId,
      vesselId,
    },
    transaction,
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
              model: db.CalendarEvent,
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

exports.addParticipant = async (
  vesselParticipantId,
  participantIds = [],
  transaction,
) => {
  return await db.VesselParticipantCrew.bulkCreate(
    participantIds.map((t) => ({
      vesselParticipantId,
      participantId: t,
    })),
    {
      transaction,
    },
  );
};

exports.removeParticipant = async (
  vesselParticipantId,
  participantId,
  transaction,
) => {
  return await db.VesselParticipantCrew.destroy({
    where: {
      vesselParticipantId,
      participantId,
    },
    transaction,
  });
};

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.VesselParticipant.bulkCreate(data, {
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
  const result = await db.VesselParticipant.bulkCreate(data, options);
  return result;
};

exports.getParticipantCrews = async (id, transaction) => {
  const results = await db.VesselParticipantCrew.findAll({
    where: {
      vesselParticipantId: {
        [Op.in]: [id].flat(),
      },
    },
    include: [
      {
        model: db.Participant,
        as: 'participant',
      },
    ],
    transaction,
  });

  return results.map((t) => t.toJSON());
};
