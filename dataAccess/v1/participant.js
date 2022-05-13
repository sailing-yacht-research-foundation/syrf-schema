const uuid = require('uuid');
const {
  errorCodes,
  statusCodes,
  participantInvitationStatus,
  calendarEventStatus,
} = require('../../enums');
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
      {
        model: db.UserProfile,
        as: 'profile',
        attributes: ['id', 'name', 'country', 'avatar'],
        include: [
          {
            model: db.ParticipationCharge,
            as: 'participationCharge',
            required: false,
            attributes: ['paymentDate', 'checkoutSessionId'],
            where: {
              calendarEventId: params.calendarEventId,
            },
          },
        ],
      },
    ];
  } else {
    if (params.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

  if (
    params.invitationStatus &&
    Array.isArray(params.invitationStatus) &&
    params.invitationStatus.length > 0
  ) {
    where.invitationStatus = {
      [db.Op.in]: params.invitationStatus,
    };
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
    model: db.CalendarEvent,
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
        invitationStatus: {
          [db.Op.in]: [
            participantInvitationStatus.ACCEPTED,
            participantInvitationStatus.SELF_REGISTERED,
          ],
        },
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

const getRacesQuery = async (participantId) => {
  const participant = await db.Participant.findByPk(participantId);
  if (!participant)
    throw new ValidationError(
      'participant not found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_VALIDATION_FAILED,
    );

  return {
    where: {
      calendarEventId: participant.calendarEventId,
    },
    attributes: {
      exclude: ['boundingBox', 'createdById', 'updatedById', 'developerId'],
    },
    include: [
      {
        model: db.VesselParticipantGroup,
        as: 'group', // using group instead of vesselParticipantGroup as alias to avoid column name length limitation of postgres
        required: true,
        attributes: ['id', 'vesselParticipantGroupId', 'name'],
        include: [
          {
            model: db.VesselParticipant,
            as: 'vesselParticipants',
            required: true,
            attributes: ['id', 'vesselParticipantId', 'vesselId'],
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
                through: {
                  attributes: [],
                },
                required: true,
                attributes: [
                  'id',
                  'publicName',
                  'trackerUrl',
                  'userProfileId',
                  'invitationStatus',
                ],
                where: {
                  id: participantId,
                  invitationStatus: {
                    [db.Op.in]: [
                      participantInvitationStatus.ACCEPTED,
                      participantInvitationStatus.SELF_REGISTERED,
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  };
};

exports.getRaces = async (id, pagination) => {
  const result = await db.CompetitionUnit.findAllWithPaging(
    await getRacesQuery(id),
    pagination,
  );

  return result;
};

exports.getRacesWithoutPaging = async (id) => {
  const result = await db.CompetitionUnit.findAll(await getRacesQuery(id));

  return result?.map((t) => t.toJSON());
};

exports.getByUserAndEvent = async (
  userProfileId,
  calendarEventId,
  transaction,
) => {
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
      {
        as: 'profile',
        model: db.UserProfile,
        attributes: ['id'],
        include: [
          {
            model: db.ParticipationCharge,
            as: 'participationCharge',
            required: false,
            attributes: ['paymentDate', 'checkoutSessionId'],
            where: {
              calendarEventId,
            },
          },
        ],
      },
    ],
    transaction,
  });

  return result?.toJSON();
};

/**
 *
 * @param {object} participant
 * @param {*} transaction
 * @returns
 */
exports.findDuplicate = async (
  { id, userProfileId, calendarEventId } = {},
  transaction,
) => {
  if (!id || !userProfileId || !calendarEventId) return null;

  const result = await db.Participant.findOne({
    where: {
      id: {
        [db.Op.ne]: id,
      },
      userProfileId,
      calendarEventId,
    },
    transaction,
  });

  return result?.toJSON();
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

exports.update = async (id, data, transaction) => {
  const [updateCount] = await db.Participant.update(data, {
    where: {
      id,
    },
    transaction,
  });

  return updateCount;
};

exports.getInvitation = async (paging, userId) => {
  const result = await db.Participant.findAllWithPaging(
    {
      where: {
        userProfileId: userId,
        invitationStatus: participantInvitationStatus.INVITED,
      },
      include: [
        {
          as: 'event',
          model: db.CalendarEvent,
          required: true,
          where: {
            status: {
              [db.Op.notIn]: [
                calendarEventStatus.DRAFT,
                calendarEventStatus.COMPLETED,
              ],
            },
          },
          attributes: [
            'id',
            'name',
            'isOpen',
            'allowRegistration',
            'approximateStartTime',
            'approximateStartTime_utc',
            'approximateStartTime_zone',
            'requiredCertifications',
            'requireCovidCertificate',
            'requireEmergencyContact',
            'requireImmigrationInfo',
            'requireMedicalProblems',
            'requireFoodAllergies',
          ],
        },
      ],
    },
    paging,
  );
  return result;
};

exports.removeFromAllVesselParticipant = async (
  id,
  { deleteOrphanedVp = true } = {},
  transaction = undefined,
) => {
  const toBeDeleted = await db.VesselParticipantCrew.findAll({
    where: {
      participantId: id,
    },
    include: [
      {
        model: db.VesselParticipant,
        as: 'vesselParticipant',
        include: [
          {
            model: db.Participant,
            as: 'participants',
          },
        ],
      },
    ],
    transaction,
  });

  const result = await db.VesselParticipantCrew.destroy({
    where: {
      participantId: id,
    },
    transaction,
  });

  if (deleteOrphanedVp) {
    // get vessel participant id that only has the deleted participant as crew
    let emptyVp = toBeDeleted
      .map((t) => t.toJSON().vesselParticipant)
      .filter(
        (vp) =>
          vp.participants?.filter((participant) => participant.id !== id)
            .length < 1,
      )
      .map((vp) => vp.id);

    // remove duplicates
    emptyVp = Array.from(new Set(emptyVp));

    // delete orphaned vessel participant
    await db.VesselParticipant.destroy({
      where: {
        id: {
          [db.Op.in]: emptyVp,
        },
      },
      transaction,
    });
  }

  return result;
};

exports.getAllWithoutPaging = async (where, attributes, transaction) => {
  let params = {};

  if (where) params.where = where;
  if (attributes) params.attributes = attributes;

  return await db.Participant.findAll({
    ...params,
    transaction,
    raw: true,
  });
};

exports.getByUserAndRace = async (raceId, userId, transaction) => {
  const result = await db.CompetitionUnit.findOne(
    {
      where: {
        id: raceId,
      },
      attributes: {
        exclude: ['boundingBox', 'createdById', 'updatedById', 'developerId'],
      },
      include: [
        {
          model: db.VesselParticipantGroup,
          as: 'group',
          required: true,
          attributes: ['id', 'vesselParticipantGroupId', 'name'],
          include: [
            {
              model: db.VesselParticipant,
              as: 'vesselParticipants',
              required: true,
              attributes: ['id', 'vesselParticipantId', 'vesselId'],
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
                  through: {
                    attributes: [],
                  },
                  attributes: [
                    'id',
                    'publicName',
                    'trackerUrl',
                    'userProfileId',
                    'invitationStatus',
                  ],
                  where: {
                    userProfileId: userId,
                    invitationStatus: {
                      [db.Op.in]: [
                        participantInvitationStatus.ACCEPTED,
                        participantInvitationStatus.SELF_REGISTERED,
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    transaction,
  );

  return result?.toJSON();
};

exports.getAllWithShareableInfo = async (calendarEventId) => {
  let include = [
    {
      model: db.UserProfile,
      as: 'profile',
      attributes: [
        'id',
        'name',
        'email',
        'birthdate',
        'address',
        'phone_number',
        'phone_number_verified',
      ],
      include: [
        {
          model: db.ParticipationCharge,
          as: 'participationCharge',
          required: false,
          attributes: ['paymentDate', 'checkoutSessionId'],
          where: {
            calendarEventId,
          },
        },
        {
          model: db.UserShareableInfo,
          as: 'shareables',
          required: false,
        },
      ],
    },
    {
      model: db.ParticipantWaiverAgreement,
      as: 'waiverAgreements',
      required: false,
      attributes: ['waiverType', 'agreedAt'],
    },
  ];

  const result = await db.Participant.findAll({
    where: {
      calendarEventId,
      invitationStatus: {
        [db.Op.in]: [
          participantInvitationStatus.ACCEPTED,
          participantInvitationStatus.SELF_REGISTERED,
        ],
      },
    },
    attributes: ['id', 'publicName', 'allowShareInformation'],
    include,
  });
  return result;
};

exports.getByIdWithVaccineAndPassport = async (participantId) => {
  let include = [
    {
      model: db.UserProfile,
      as: 'profile',
      attributes: ['id', 'name'],
      include: [
        {
          model: db.UserShareableInfo,
          as: 'shareables',
          required: false,
          attributes: ['covidVaccinationCard', 'passportPhoto'],
        },
      ],
    },
  ];

  const result = await db.Participant.findByPk(participantId, {
    attributes: ['id', 'allowShareInformation'],
    include,
  });
  return result;
};
