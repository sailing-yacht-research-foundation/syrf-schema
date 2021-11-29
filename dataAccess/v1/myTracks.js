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
          attributes: ['id', 'totalTraveledDistance', 'firstPosition'],
          required: false,
          where: {
            competitionUnitId: {
              [db.Op.eq]: db.sequelize.col('TrackHistory.competitionUnitId'),
            },
          },
        },
      ],
    },
    pagination,
  );

  return result;
};

exports.getById = async (id) => {
  const result = await db.TrackHistory.findByPk(id, {
    include: [
      {
        model: db.CalenderEvent,
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
      }
    : null;
};

exports.getTrackTime = async (id) => {
  if (!id) return null;

  const track = await db.TrackHistory.findByPk(id);

  const result = await db.VesselParticipantCrewTrack.findAll({
    where: {
      vesselParticipantCrewId: track.crewId,
      competitionUnitId: track.competitionUnitId,
    },
    attributes: [
      [db.Sequelize.fn('min', db.Sequelize.col('pingTime')), 'startTime'],
      [db.Sequelize.fn('max', db.Sequelize.col('pingTime')), 'endTime'],
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

exports.addMyTrack = async (id, data) => {
  if (!id) id = uuid.v4();

  const [result] = await db.TrackHistory.upsert({
    ...data,
    id,
  });

  return result?.toJSON();
};
