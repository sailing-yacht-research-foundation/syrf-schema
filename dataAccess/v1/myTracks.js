const uuid = require('uuid');
const db = require('../../index');
const { dataSources } = require('../../enums');

const excludeMeta = ['ownerId', 'createdById', 'updatedById', 'developerId'];

/**
 *
 * @param {String} userId
 * @param {Boolean} isPrivate
 * @param {import('../../types/pagination').PaginationRequest} pagination
 * @returns
 */
exports.getMyTracks = async (userId, isPrivate, pagination) => {
  let calendarEvent = {
    model: db.CalendarEvent,
    as: 'event',
    required: true,
    attributes: {
      exclude: [
        'startDay',
        'startMonth',
        'startYear',
        'endDay',
        'endMonth',
        'endYear',
        'ics',
        ...excludeMeta,
      ],
    },
  };

  if (isPrivate != null) {
    calendarEvent.where = { isPrivate };
  }

  const nameFilter = pagination.filters.find((t) => t.field === 'name');
  if (nameFilter) {
    const dbOp = nameFilter.opr === 'eq' ? db.Op.eq : db.Op.iLike;

    const filters = nameFilter.value
      .split(' - ')
      .map((t) =>
        ['$event.name$', '$competitionUnit.name$'].map((f) => ({
          [f]: {
            [dbOp]: `%${t}%`,
          },
        })),
      )
      .flat();

    nameFilter.query = {
      [db.Op.or]: filters,
    };

    nameFilter.opr = 'custom';
  }

  const result = await db.TrackHistory.findAllWithPaging(
    {
      include: [
        calendarEvent,
        {
          model: db.VesselParticipantGroup,
          as: 'group',
          attributes: ['id', 'vesselParticipantGroupId'],
        },
        {
          model: db.VesselParticipant,
          as: 'vesselParticipant',
          attributes: ['id'],
          include: [
            {
              model: db.Vessel,
              paranoid: false,
              as: 'vessel',
              attributes: ['id', 'globalId', 'publicName'],
            },
          ],
        },
        {
          model: db.Participant,
          as: 'participant',
          attributes: ['id', 'publicName'],
          where: {
            userProfileId: userId,
          },
        },
        {
          model: db.CompetitionUnit,
          as: 'competitionUnit',
          required: true,
          attributes: {
            exclude: [
              'boundingBox',
              'createdById',
              'updatedById',
              'developerId',
            ],
          },
        },
        {
          model: db.VesselParticipantCrewTrackJson,
          as: 'trackJson',
          attributes: [
            'id',
            'totalTraveledDistance',
            'firstPosition',
            'startTime',
            'endTime',
            'locationUpdateCount',
          ],
          where: {
            competitionUnitId: {
              [db.Op.eq]: db.sequelize.col('TrackHistory.competitionUnitId'),
            },
          },
        },
      ],
    },
    {
      ...pagination,

      defaultSort: [
        db.Sequelize.literal(
          `CASE WHEN event.source != '${dataSources.SYRF}' THEN "TrackHistory"."createdAt" ELSE "trackJson"."endTime" END DESC NULLS FIRST`,
        ),
        ['trackJson', 'startTime', 'DESC NULLS LAST'],
      ],
      customCountField: `"trackJson"."id"`,
    },
  );

  return result;
};

exports.getById = async (id) => {
  const result = await db.TrackHistory.findByPk(id, {
    include: [
      {
        model: db.CalendarEvent,
        as: 'event',
        required: true,
        include: [
          {
            model: db.UserProfile,
            as: 'editors',
            attributes: ['id', 'name'],
            through: {
              attributes: [],
            },
          },
        ],
      },
      {
        model: db.VesselParticipantGroup,
        as: 'group',
        attributes: ['id', 'vesselParticipantGroupId'],
      },
      {
        model: db.VesselParticipant,
        as: 'vesselParticipant',
        attributes: ['id'],
        include: [
          {
            model: db.Vessel,
            paranoid: false,
            as: 'vessel',
            attributes: ['id', 'globalId', 'publicName'],
          },
        ],
      },
      {
        model: db.Participant,
        as: 'participant',
        attributes: ['id', 'publicName'],
      },
      {
        model: db.CompetitionUnit,
        as: 'competitionUnit',
        attributes: {
          exclude: ['boundingBox', 'createdById', 'updatedById', 'developerId'],
        },
      },
    ],
  });

  return result?.toJSON();
};

exports.getTracksGeoJson = async ({ trackId, trackJsonId }, userId) => {
  if (!trackId || !userId) return null;

  const track = await db.TrackHistory.findOne({
    where: {
      id: trackId,
      userProfileId: userId,
    },
  });

  if (!track) {
    return null;
  }

  const result = await db.VesselParticipantCrewTrackJson.findOne({
    where: Object.assign(
      {
        vesselParticipantCrewId: track.crewId,
        competitionUnitId: track.competitionUnitId,
      },
      trackJsonId
        ? {
            id: trackJsonId,
          }
        : {},
    ),
    attributes: {
      exclude: ['id'],
    },
    raw: true,
  });

  return result
    ? {
        storageKey: result.storageKey,
        vesselParticipantCrewId: result.vesselParticipantCrewId,
        phoneModel: track.phoneModel,
        phoneOS: track.phoneOS,
      }
    : null;
};

exports.getTrackTime = async (id) => {
  if (!id) return null;

  const track = await db.TrackHistory.findByPk(id);

  const result = await db.VesselParticipantCrewTrackJson.findAll({
    where: {
      vesselParticipantCrewId: track.crewId,
      competitionUnitId: track.competitionUnitId,
    },
    attributes: [
      [db.Sequelize.fn('min', db.Sequelize.col('startTime')), 'startTime'],
      [db.Sequelize.fn('max', db.Sequelize.col('endTime')), 'endTime'],
    ],
  });

  return result[0];
};

exports.getMyTrackByCompetition = async (userId, competitionUnitId) => {
  const result = await db.TrackHistory.findOne({
    where: {
      userProfileId: userId,
      competitionUnitId,
    },
  });

  return result;
};

exports.addMyTrack = async (id, data, transaction) => {
  if (!id) id = uuid.v4();

  const [result] = await db.TrackHistory.upsert(
    {
      ...data,
      id,
    },
    { transaction },
  );

  return result?.toJSON();
};

exports.addCrewTrackJson = async (data, transaction) => {
  return await db.VesselParticipantCrewTrackJson.create(data, {
    validate: true,
    transaction,
  });
};

exports.getActiveTrack = async (competitionUnitId, crewId, transaction) => {
  return await db.VesselParticipantCrewTrackJson.findOne({
    where: {
      competitionUnitId,
      vesselParticipantCrewId: crewId,
      endTime: null,
    },
    raw: true,
    transaction,
  });
};

exports.getCrewTrackByTrackId = async (crewTrackJsonId, transaction) => {
  return (
    await db.VesselParticipantCrewTrackJson.findByPk(crewTrackJsonId, {
      transaction,
      include: [
        {
          model: db.VesselParticipantCrew,
          as: 'crew',
          attributes: ['id', 'vesselParticipantId'],
          include: [
            {
              model: db.Participant,
              as: 'participant',
              attributes: ['id', 'userProfileId', 'calendarEventId'],
            },
          ],
        },
        {
          model: db.CompetitionUnit,
          as: 'competition',
          attributes: ['id', 'name', 'startTime', 'endTime', 'status'],
          include: [
            {
              model: db.CalendarEvent,
              as: 'calendarEvent',
              attributes: ['id', 'name', 'status'],
            },
          ],
        },
      ],
    })
  )?.toJSON();
};

exports.getActiveTrackByUserId = async (userId, paging) => {
  const result = await db.VesselParticipantCrewTrackJson.findAllWithPaging(
    {
      where: {
        endTime: null,
      },
      include: [
        {
          model: db.VesselParticipantCrew,
          as: 'crew',
          attributes: ['id', 'vesselParticipantId'],
          required: true,
          include: [
            {
              model: db.Participant,
              as: 'participant',
              required: true,
              attributes: ['id', 'userProfileId', 'calendarEventId'],
              where: {
                userProfileId: userId,
              },
            },
          ],
        },
        {
          model: db.CompetitionUnit,
          as: 'competition',
          attributes: ['id', 'name', 'startTime', 'status'],
          include: [
            {
              model: db.CalendarEvent,
              as: 'calendarEvent',
              attributes: ['id', 'name', 'status'],
            },
          ],
        },
      ],
    },
    {
      ...paging,
      defaultSort: [
        ['endTime', 'DESC NULLS FIRST'],
        ['startTime', 'DESC NULLS LAST'],
      ],
    },
  );

  return result;
};

exports.updateTrack = async (trackId, data, transaction) => {
  return await db.VesselParticipantCrewTrackJson.update(data, {
    where: {
      id: trackId,
    },
    transaction,
  });
};
