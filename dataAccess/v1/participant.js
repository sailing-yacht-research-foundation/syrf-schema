const uuid = require('uuid');
const { errorCodes, statusCodes } = require('../../enums');
const db = require('../../index');
const {
  includeMeta,
  excludeMeta,
  ValidationError,
  emptyPagingResponse,
} = require('../../utils/utils');

const include = [
  {
    as: 'profile',
    model: db.UserProfile,
    attributes: ['id', 'name'],
  },
  {
    as: 'event',
    model: db.CalendarEvent,
    attributes: ['id', 'name', 'isOpen'],
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

exports.upsert = async (id, data = {}, transaction = undefined) => {
  if (!id) id = uuid.v4();

  let options;
  if (transaction) {
    options = { transaction };
  }
  const [result] = await db.Participant.upsert({ ...data, id }, options);

  return result?.toJSON();
};

exports.getAll = async (paging, params) => {
  let where = {};

  if (paging.query) {
    where.publicName = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  let include = [
    {
      model: db.VesselParticipant,
      as: 'vesselParticipants',
      through: {
        attributes: [],
      },
      attributes: [
        'id',
        'vesselParticipantId',
        'vesselId',
        'vesselParticipantGroupId',
      ],
    },
  ];
  if (params.calendarEventId) {
    where.calendarEventId = params.calendarEventId;

    if (params.assigned === false) {
      where['$vesselParticipants.id$'] = {
        [db.Op.is]: null,
      };
    }

    include = [
      {
        model: db.VesselParticipant,
        required: params.assigned === true,
        as: 'vesselParticipants',
        through: {
          attributes: [],
        },
        attributes: [
          'id',
          'vesselParticipantId',
          'vesselId',
          'vesselParticipantGroupId',
        ],
        include: [
          {
            model: db.Vessel,
            as: 'vessel',
            attributes: [
              'id',
              'vesselId',
              'globalId',
              'publicName',
              'scope',
              'bulkCreated',
            ],
            paranoid: false,
          },
          {
            model: db.VesselParticipantGroup,
            as: 'group',
            attributes: ['id', 'vesselParticipantGroupId', 'name'],
          },
        ],
      },
    ];
  } else {
    if (params.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

  let attributes = {
    where,
    include,
  };

  if (params.assigned === false) attributes.subQuery = false;

  const result = await db.Participant.findAllWithPaging(attributes, paging);
  return result;
};

exports.getById = async (id, transaction) => {
  const result = await db.Participant.findByPk(id, {
    include,
    transaction,
  });

  return result?.toJSON();
};

exports.getByUserId = async (id, pagination, isPrivate = null) => {
  let eventInclude = {
    model: db.CalenderEvent,
    as: 'event',
    attributes: {
      exclude: [...excludeMeta, 'ics'],
    },
  };

  if (typeof isPrivate === 'boolean') {
    eventInclude.where = {
      isPrivate,
    };
    eventInclude.required = true;
  }

  const result = await db.Participant.findAllWithPaging(
    {
      where: {
        userProfileId: id,
      },
      include: [eventInclude],
    },
    pagination,
  );

  return result;
};

exports.delete = async (id, transaction) => {
  let data = null;
  let isMultiple = Array.isArray(id);
  if (!isMultiple) {
    data = await db.Participant.findByPk(id, {
      include,
      transaction,
    });
    id = [id];
  }

  let vpc = await db.VesselParticipantCrew.findAll({
    where: {
      participantId: {
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
    await db.Participant.destroy({
      where: {
        id: {
          [db.Op.in]: id,
        },
      },
    }),
    db.VesselParticipantCrew.destroy({
      where: {
        participantId: {
          [db.Op.in]: id,
        },
      },
      transaction,
    }),
    db.VesselParticipantCrewTrackJson.destroy(vpcParam),
  ]);

  return !isMultiple ? data?.toJSON() : count;
};

exports.getEvent = async (id) => {
  const result = await db.Participant.findByPk(id, {
    include: [
      {
        model: db.CalendarEvent,
        as: 'event',
      },
    ],
  });

  return result?.toJSON();
};

exports.getRaces = async (id, pagination) => {
  const participant = await db.Participant.findByPk(id);
  if (!participant)
    throw new ValidationError(
      'participant not found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_VALIDATION_FAILED,
    );

  const result = await db.CompetitionUnit.findAllWithPaging(
    {
      where: {
        calendarEventId: participant.calendarEventId,
      },
      attributes: {
        exclude: ['boundingBox', 'createdById', 'updatedById', 'developerId'],
      },
      include: [
        {
          model: db.VesselParticipantGroup,
          as: 'vesselParticipantGroup',
          required: true,
          attributes: ['id', 'vesselParticipantGroupId'],
          include: [
            {
              model: db.VesselParticipant,
              as: 'vesselParticipants',
              required: true,
              attributes: ['id', 'vesselParticipantId'],
              include: [
                {
                  model: db.Vessel,
                  as: 'vessel',
                  attributes: ['id', 'globalId', 'publicName'],
                  paranoid: false,
                },
                {
                  model: db.Participant,
                  as: 'participants',
                  required: true,
                  attributes: [],
                  where: {
                    id: id,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    pagination,
  );

  return result;
};

exports.getByUserAndEvent = async (userProfileId, calendarEventId) => {
  const result = await db.Participant.findOne({
    where: {
      userProfileId,
      calendarEventId,
    },
    include: [
      {
        model: db.CalendarEvent,
        as: 'event',
      },
    ],
  });

  return result;
};

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.Participant.bulkCreate(data, {
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
  const result = await db.Participant.bulkCreate(data, options);
  return result;
};

exports.updateUserlessParticipants = async (
  userProfileId,
  email,
  transaction,
) => {
  const [updateCount] = await db.Participant.update(
    { userProfileId },
    {
      where: {
        participantId: email,
        userProfileId: { [db.Op.eq]: null },
      },
      transaction,
    },
  );

  return updateCount;
};
