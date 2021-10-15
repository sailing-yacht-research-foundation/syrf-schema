const uuid = require('uuid');
const { errorCodes, statusCodes } = require('../../enums');
const db = require('../../index');
const {
  includeMeta,
  ValidationError,
} = require('../../utils/utils');

const include = [
  {
    as: 'profile',
    model: db.UserProfile,
    attributes: ['id', 'name'],
  },
  {
    as: 'event',
    model: db.CalenderEvent,
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

exports.getAll = async (paging, calendarEventId, assigned) => {
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
  if (calendarEventId) {
    where.calendarEventId = calendarEventId;

    if (assigned === false) {
      where['$vesselParticipants.id$'] = {
        [db.Op.is]: null,
      };
    }

    include = [
      {
        model: db.VesselParticipant,
        required: assigned === true,
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
          },
          {
            model: db.VesselParticipantGroup,
            as: 'group',
            attributes: ['id', 'vesselParticipantGroupId', 'name'],
          },
        ],
      },
    ];
  }

  let attributes = {
    where,
    include,
  };

  if (assigned === false) attributes.subQuery = false;

  const result = await db.Participant.findAllWithPaging(attributes, paging);
  return result;
};

exports.getById = async (id) => {
  const result = await db.Participant.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.getByUserId = async (id, pagination) => {
  const result = await db.Participant.findAllWithPaging(
    {
      where: {
        userProfileId: id,
      },
      include: [
        {
          model: db.CalenderEvent,
          as: 'event',
        },
      ],
    },
    pagination,
  );

  return result;
};

exports.delete = async (id) => {
  const data = await db.Participant.findByPk(id, {
    include,
  });

  if (data) {
    await db.Participant.destroy({
      where: {
        id: id,
      },
    });
  }

  return data?.toJSON();
};

exports.getEvent = async (id) => {
  const result = await db.Participant.findByPk(id, {
    include: [
      {
        model: db.CalenderEvent,
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
        model: db.CalenderEvent,
        as: 'event',
      },
    ],
  });

  return result;
};