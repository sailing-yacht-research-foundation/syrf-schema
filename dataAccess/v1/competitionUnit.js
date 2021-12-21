const uuid = require('uuid');
const { competitionUnitStatus, conversionValues } = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');
const { includeMeta, emptyPagingResponse } = require('../../utils/utils');

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
  }

  let eventInclude = {
    as: 'calendarEvent',
    model: db.CalendarEvent,
    required: false,
    where: {},
    attributes: ['id', 'name', 'isPrivate'],
  };
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
      include: [eventInclude],
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
