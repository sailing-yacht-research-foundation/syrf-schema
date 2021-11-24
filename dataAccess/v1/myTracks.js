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
      ],
    },
    pagination,
  );

  return result;
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

exports.getTracksGeoJson = async (trackId) => {
  if (!trackId) return '';

  const track = await db.TrackHistory.findByPk(trackId);

  if (!track) {
    return '';
  }

  const result = await db.VesselParticipantCrewTrackJson.findOne({
    where: {
      vesselParticipantCrewId: track.crewId,
      competitionUnitId: track.competitionUnitId,
    },
    attributes: {
      exclude: ['id', 'vesselParticipantCrewId', 'competitionUnitId'],
    },
    raw: true,
  });

  return result ? result.storageKey : '';
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
