const uuid = require('uuid');
const db = require('../../index');

const excludeMeta = ['ownerId', 'createdById', 'updatedById', 'developerId'];

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
      multiSort:
        pagination.multiSort.length < 1 && !pagination.sort
          ? [
              ['trackJson', 'endTime', 'DESC NULLS FIRST'],
              ['trackJson', 'startTime', 'DESC NULLS LAST'],
            ]
          : pagination.multiSort,
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

exports.getTracksByTrackId = async (trackId, timeFrom, timeTo) => {
  if (!trackId) return null;

  const track = await db.TrackHistory.findByPk(trackId);

  const result = await db.VesselParticipantCrewTrack.findAll({
    where: {
      vesselParticipantCrewId: track.crewId,
      competitionUnitId: track.competitionUnitId,
      pingTime: {
        [db.Op.between]: [timeFrom, timeTo],
      },
    },
    attributes: {
      exclude: ['id', 'vesselParticipantCrewId', 'competitionUnitId'],
    },
    order: [['pingTime', 'ASC']],
    raw: true,
  });

  return result;
};

exports.getTracksGeoJson = async (trackId, userId) => {
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
    where: {
      vesselParticipantCrewId: track.crewId,
      competitionUnitId: track.competitionUnitId,
    },
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
  return await db.VesselParticipantCrewTrackJson.findByPk(crewTrackJsonId, {
    transaction,
    raw: true,
  });
};
