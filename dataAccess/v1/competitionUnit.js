const uuid = require('uuid');
const {
  competitionUnitStatus,
  conversionValues,
  calendarEventStatus,
  participantInvitationStatus,
  groupMemberStatus,
  dataSources,
} = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');
const {
  includeMeta,
  emptyPagingResponse,
  removeDomainFromUrl,
} = require('../../utils/utils');

const include = [
  {
    as: 'calendarEvent',
    model: db.CalendarEvent,
    attributes: [
      'id',
      'name',
      'isPrivate',
      'isOpen',
      'status',
      'allowRegistration',
      'organizerGroupId',
      'stripeProductId',
      'stripePricingId',
      'participatingFee',
      'location',
      'source',
      'ownerId',
      'isSimulation',
      'scrapedOriginalId',
    ],
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
  {
    as: 'vesselParticipantGroup',
    model: db.VesselParticipantGroup,
    attributes: ['id', 'vesselParticipantGroupId'],
  },
  ...includeMeta,
];

exports.upsert = async (id, data = {}, transaction) => {
  if (!id) id = uuid.v4();

  const [result] = await db.CompetitionUnit.upsert(
    {
      ...data,
      id,
    },
    { transaction },
  );

  return result?.toJSON();
};

exports.getAll = async (paging, params) => {
  let where = {};
  let order = [];
  let replacements = {};
  let attributes;
  if (paging.query) {
    where.name = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  if (params.calendarEventId) {
    where.calendarEventId = params.calendarEventId;
  }
  // only allow list events without createdBy id if listing by position or by event
  if (!params.calendarEventId && !params.position) {
    if (params.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

  let eventInclude = {
    as: 'calendarEvent',
    model: db.CalendarEvent,
    required: false,
    where: {},
    attributes: ['id', 'name', 'isPrivate'],
  };

  if (params.position) {
    // Query by locations
    const [lon, lat] = params.position;
    replacements = { lon: parseFloat(lon), lat: parseFloat(lat) };
    const distanceInMeters =
      params.radius * conversionValues.nauticalMilesToMeters;
    const sourceLocation = db.Sequelize.literal(`ST_MakePoint(:lon, :lat)`);

    attributes = {
      include: [
        [
          db.Sequelize.fn(
            'ST_DistanceSphere',
            db.Sequelize.literal('"approximateStartLocation"'),
            sourceLocation,
          ),
          'distance',
        ],
      ],
    };
    where = {
      ...where,
      [db.Op.and]: [
        db.Sequelize.where(
          db.Sequelize.fn(
            'ST_DistanceSphere',
            db.Sequelize.literal('"approximateStartLocation"'),
            sourceLocation,
          ),
          {
            [db.Op.lte]: distanceInMeters,
          },
        ),
      ],
    };
    // Needed, this will trigger the index scan (Nearest Neighbouring Searching)
    // https://postgis.net/workshops/postgis-intro/knn.html
    order = [
      [
        db.Sequelize.literal(
          `"approximateStartLocation" <-> 'SRID=4326;POINT(:lon :lat)'::geometry`,
        ),
      ],
    ];

    if (
      typeof params.includeSimulation !== 'boolean' ||
      params.includeSimulation === false
    ) {
      eventInclude.where.isSimulation = false;
      eventInclude.required = true;
    }
  }

  if (params.status) {
    where.status = params.status;
  }
  if (params.eventStatus) {
    eventInclude.where.status = params.eventStatus;
  }

  if (typeof params.isOpen === 'boolean') {
    eventInclude.where.isOpen = params.isOpen;
    eventInclude.required = true;
  }

  if (typeof params.isPrivate === 'boolean') {
    eventInclude.where.isPrivate = params.isPrivate;
    eventInclude.required = true;
  }

  const result = await db.CompetitionUnit.findAllWithPaging(
    {
      attributes,
      where,
      replacements,
      include: [
        eventInclude,
        {
          model: db.Course,
          as: 'course',
          attributes: ['id', 'name'],
        },
      ],
    },
    { ...paging, customSort: order },
  );
  return result;
};

exports.getById = async (id, includeDetail = true, transaction) => {
  let attr = {};

  if (includeDetail) attr.include = include;

  const result = await db.CompetitionUnit.findByPk(id, {
    ...attr,
    transaction,
  });

  return result?.toJSON();
};

exports.delete = async (id, transaction) => {
  let data = null;
  let isMultiple = Array.isArray(id);

  if (!isMultiple) {
    data = await db.CompetitionUnit.findByPk(id, {
      include,
      transaction,
    });
    id = [id];
  }

  let param = {
    where: {
      competitionUnitId: {
        [Op.in]: id,
      },
    },
    transaction,
  };

  const [count] = await Promise.all([
    db.CompetitionUnit.destroy({
      where: {
        id: {
          [Op.in]: id,
        },
      },
      transaction,
    }),
    db.VesselParticipantCrewTrackJson.destroy(param),
    db.TrackHistory.destroy(param),
    db.CompetitionResult.destroy(param),
    db.CompetitionLeg.destroy(param),
    db.CompetitionPointTrack.destroy(param),
    db.CompetitionPointTrackJson.destroy(param),
    db.CompetitionUnitWind.destroy(param),
    db.SlicedWeather.destroy(param),
    db.VesselParticipantLeg.destroy(param),
    db.VesselParticipantTrackJson.destroy(param),
    db.VesselParticipantTrack.destroy(param),
    db.SlicedWeather.destroy(param),
  ]);

  return !isMultiple ? data?.toJSON() : count;
};

exports.setStart = async (id, transaction) => {
  const result = await db.CompetitionUnit.update(
    {
      status: competitionUnitStatus.ONGOING,
    },
    {
      where: {
        id,
      },
      transaction,
    },
  );

  return result[0];
};

exports.setEnd = async (id, transaction) => {
  const result = await db.CompetitionUnit.update(
    {
      endTime: new Date(),
      isCompleted: true,
      status: competitionUnitStatus.COMPLETED,
    },
    {
      where: {
        id,
      },
      transaction,
    },
  );

  return result[0];
};

exports.updateCourse = async (id, courseId) => {
  const result = await db.CompetitionUnit.update(
    {
      courseId: courseId,
    },
    {
      where: {
        id,
      },
    },
  );
  return result[0];
};

exports.getOnGoingRacesWithCourse = async () => {
  const result = await db.CompetitionUnit.findAll({
    attributes: ['id', 'courseId'],
    raw: true,
    where: {
      status: competitionUnitStatus.ONGOING,
      courseId: {
        [db.Op.ne]: null,
      },
    },
  });

  return result;
};

exports.updateCountryCity = async (
  competitionUnitIds,
  data = null,
  transaction,
) => {
  await db.CompetitionUnit.update(
    {
      country: data?.country,
      city: data?.city,
      approximateStartLocation: !data
        ? null
        : {
            crs: {
              type: 'name',
              properties: { name: 'EPSG:4326' },
            },
            type: 'Point',
            coordinates: data.centerPoint,
          },
      approximateStart_zone: data?.timezone,
    },
    {
      where: {
        id: {
          [Op.in]: competitionUnitIds,
        },
      },
      transaction: transaction,
    },
  );
};

exports.addOpenGraphImage = async (competitionUnitIds, data, transaction) => {
  const { openGraphImage } = data;
  await db.CompetitionUnit.update(
    {
      openGraphImage,
    },
    {
      where: {
        id: {
          [Op.in]: competitionUnitIds,
        },
      },
      transaction,
    },
  );
};

exports.getTracksCountByCompetition = async (competitionIds) => {
  const competitions = await db.CompetitionUnit.findAll({
    attributes: [
      'id',
      [
        db.sequelize.fn('count', db.sequelize.col('"vpTrackJsons"."id"')),
        'trackCount',
      ],
    ],
    where: {
      id: {
        [Op.in]: competitionIds,
      },
    },
    include: [
      {
        model: db.VesselParticipantTrackJson,
        as: 'vpTrackJsons',
        attributes: [],
        required: false,
      },
    ],
    subQuery: false,
    group: ['"CompetitionUnit"."id"'],
  });
  let trackCount = 0;
  competitions.forEach((row) => {
    trackCount += Number(row.getDataValue('trackCount'));
  });

  return trackCount;
};

exports.update = async (id, data, transaction) => {
  const [updateCount, updatedData] = await db.CompetitionUnit.update(data, {
    where: {
      id,
    },
    returning: true,
    transaction,
  });

  return { updateCount, updatedData };
};

exports.getScheduledRaces = async (transaction) => {
  const result = await db.CompetitionUnit.findAll({
    where: {
      status: competitionUnitStatus.SCHEDULED,
    },
    include: [
      {
        model: db.CalendarEvent,
        as: 'calendarEvent',
        attribute: ['id', 'name', 'status'],
        required: true,
        where: {
          status: {
            [db.Op.in]: [
              calendarEventStatus.SCHEDULED,
              calendarEventStatus.ONGOING,
            ],
          },
        },
      },
    ],
    transaction,
  });
  return result.map((t) => t.toJSON());
};

exports.getUserRelationToCompetitionUnit = async (
  ids = [],
  userId,
  options = {},
  transaction,
) => {
  const result = await db.CompetitionUnit.findAll({
    ...options,
    where: {
      id: {
        [db.Op.in]: ids,
      },
    },
    include: [
      {
        model: db.VesselParticipantGroup,
        as: 'group',
        attributes: ['id', 'vesselParticipantGroupId', 'name'],
        include: [
          {
            model: db.VesselParticipant,
            as: 'vesselParticipants',
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
      {
        model: db.CalendarEvent,
        as: 'calendarEvent',
        attributes: ['id', 'name', 'status'],
        include: [
          {
            model: db.UserProfile,
            as: 'editors',
            attributes: ['id', 'name', 'avatar'],
            required: false,
            through: {
              attributes: [],
            },
            where: {
              id: userId,
            },
          },
          {
            model: db.Group,
            as: 'groupEditors',
            attributes: ['id', 'groupName', 'groupImage'],
            through: {
              attributes: [],
            },
            include: [
              {
                model: db.GroupMember,
                as: 'groupMember',
                attributes: ['id', 'groupId', 'userId', 'isAdmin'],
                where: {
                  status: groupMemberStatus.accepted,
                  userId,
                },
              },
            ],
          },
        ],
      },
    ],
    transaction,
  });
  return result.map((t) => t.toJSON());
};

exports.getUntrackedRaces = async (filterDate, transaction) => {
  const result = await db.CompetitionUnit.findAll({
    where: {
      approximateStart: {
        [db.Op.lte]: filterDate,
      },
      '$tracks.id$': null,
    },
    subQuery: false,
    include: [
      {
        model: db.TrackHistory,
        as: 'tracks',
        required: false,
        attributes: ['id'],
      },
      {
        model: db.CalendarEvent,
        as: 'calendarEvent',
        attributes: ['id'],
        required: true,
        where: {
          status: {
            [db.Op.in]: [
              calendarEventStatus.SCHEDULED,
              calendarEventStatus.ONGOING,
              calendarEventStatus.COMPLETED,
            ],
          },
          source: dataSources.SYRF,
        },
        include: [
          {
            model: db.CompetitionUnit,
            as: 'competitionUnit',
            attributes: ['id'],
          },
        ],
      },
    ],
    transaction,
  });

  return result.map((t) => t.toJSON());
};

/**
 *
 * @param {string} id
 * @param {import('sequelize').Transaction} transaction
 * @returns {import('../../types/dataAccess').RelatedFile[]}
 */
exports.getRelatedFiles = async (id, transaction) => {
  const [competitionUnit, vpTrackJson, pointTrackJson, slicedWeather] =
    await Promise.all([
      db.CompetitionUnit.findByPk(id, { transaction }),
      db.VesselParticipantTrackJson.findAll({
        where: {
          competitionUnitId: id,
        },
        transaction,
      }),
      db.VesselParticipantCrewTrackJson.findAll({
        where: {
          competitionUnitId: id,
        },
        transaction,
      }),
      db.CompetitionPointTrackJson.findAll({
        where: {
          competitionUnitId: id,
        },
        transaction,
      }),
      db.SlicedWeather.findAll({
        where: {
          competitionUnitId: id,
        },
        transaction,
      }),
    ]);

  const result = [];

  if (!competitionUnit) return result;

  if (competitionUnit.openGraphImage)
    result.push({
      type: 'og_image',
      path: removeDomainFromUrl(competitionUnit.openGraphImage),
      bucket: 'opengraph_image',
    });
  result.push(
    ...vpTrackJson
      .filter((t) => t.providedStorageKey)
      .map((t) => ({
        type: 'vp_track_json',
        path: t.providedStorageKey,
        bucket: 'individual_track',
      })),
  );
  result.push(
    ...vpTrackJson
      .filter((t) => t.simplifiedStorageKey)
      .map((t) => ({
        type: 'vp_simplified_track_json',
        path: t.simplifiedStorageKey,
        bucket: 'individual_track',
      })),
  );
  result.push(
    ...pointTrackJson
      .filter((t) => t.storageKey)
      .map((t) => ({
        type: 'vp_crew_track_json',
        path: t.storageKey,
        bucket: 'individual_track',
      })),
  );
  result.push(
    ...slicedWeather
      .filter((t) => t.s3Key)
      .map((t) => ({
        type: 'sliced_weather',
        path: t.s3Key,
        bucket: 'sliced_weather',
      })),
  );

  return result;
};

exports.getWithVesselParticipant = async (id, vesselParticipantId) => {
  const result = await db.CompetitionUnit.findByPk(id, {
    include: [
      {
        as: 'vesselParticipantGroup',
        model: db.VesselParticipantGroup,
        attributes: ['id', 'name'],
        include: [
          {
            as: 'vesselParticipants',
            model: db.VesselParticipant,
            attributes: ['id'],
            where: {
              id: vesselParticipantId,
            },
            include: [
              {
                as: 'vessel',
                model: db.Vessel,
                attributes: ['id', 'publicName'],
              },
              {
                // Note: Need to use crews instead of participants, or it will not return the details, only id.
                // Not sure about the reason, might be because double defined and sequelize only works with the later.
                // Maybe we can remove the definition if it's not used and keep only 1 to avoid confusion in the future?
                as: 'crews',
                model: db.Participant,
                attributes: [
                  'id',
                  'invitationStatus',
                  'userProfileId',
                  'publicName',
                ],
                include: [
                  {
                    as: 'profile',
                    model: db.UserProfile,
                    attributes: ['id', 'name', 'email', 'avatar'],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  return result?.toJSON();
};

exports.getAllActiveSimulations = async ({ userId } = {}) => {
  let eventWhere = {
    isSimulation: true,
  };

  if (userId) eventWhere.ownerId = userId;

  const result = await db.CompetitionUnit.findAll({
    where: {
      status: competitionUnitStatus.ONGOING,
    },
    include: [
      {
        as: 'calendarEvent',
        model: db.CalendarEvent,
        required: true,
        where: eventWhere,
        attributes: [
          'id',
          'name',
          'isPrivate',
          'isOpen',
          'status',
          'allowRegistration',
          'organizerGroupId',
          'stripeProductId',
          'stripePricingId',
          'participatingFee',
          'location',
          'source',
          'ownerId',
          'isSimulation',
          'scrapedOriginalId',
        ],
      },
    ],
  });
  return result.map((t) => t.toJSON());
};

exports.setCanceled = async (id, transaction) => {
  const result = await db.CompetitionUnit.update(
    {
      endTime: new Date(),
      isCompleted: true,
      status: competitionUnitStatus.CANCELED,
    },
    {
      where: {
        id,
      },
      transaction,
    },
  );

  return result[0];
};

exports.getWinds = async (id) => {
  const result = await db.CompetitionUnitWind.findAll({
    where: {
      competitionUnitId: id,
    },
  });

  return result.map((t) => t.toJSON());
};

exports.bulkWriteWinds = async (data = [], transaction) => {
  const result = await db.CompetitionUnitWind.bulkCreate(data, {
    transaction,
    updateOnDuplicate: ['startTime', 'endTime'],
  });

  return result.map((t) => t.toJSON());
};

exports.getAllByIds = async (ids = [], { attributes } = {}) => {
  return await db.CompetitionUnit.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    attributes: Array.isArray(attributes) ? attributes : ['id'],
    raw: true,
  });
};
