const db = require('../../models');

var currentStreamSet = new Map();

exports.upsert = async (sub, streamData = {}) => {
  currentStreamSet.set(sub, streamData);
  return streamData;
};

exports.getById = async (sub) => {
  return currentStreamSet.get(sub);
};

exports.delete = async (sub) => {
  const data = currentStreamSet.get(sub);
  currentStreamSet.delete(sub);

  return data;
};

exports.clear = async () => {
  currentStreamSet.clear();
};

exports.validateParticipant = async (userId, vesselParticipantId) => {
  const result = await db.VesselParticipantCrew.findOne({
    where: {
      vesselParticipantId,
      '$participant.userProfileId$': userId,
    },
    attributes: ['id', 'vesselParticipantId', 'participantId'],
    subQuery: false,
    include: [
      {
        as: 'participant',
        model: db.Participant,
        attributes: ['userProfileId'],
        where: {
          userProfileId: userId,
        },
      },
      {
        as: 'vesselParticipant',
        model: db.VesselParticipant,
        attributes: ['id'],
        include: [
          {
            as: 'group',
            model: db.VesselParticipantGroup,
            attributes: ['id'],
          },
        ],
      },
    ],
  });

  return result?.toJSON();
};

exports.validateParticipantByCUId = async (userId, competitionUnitId) => {
  const result = await db.VesselParticipantCrew.findOne({
    attributes: ['id', 'vesselParticipantId', 'participantId'],
    subQuery: false,
    include: [
      {
        as: 'participant',
        model: db.Participant,
        attributes: ['userProfileId'],
        required: true,
        where: {
          userProfileId: userId,
        },
        include: [
          {
            as: 'event',
            model: db.CalenderEvent,
            attributes: ['id'],
          },
        ],
      },
      {
        as: 'vesselParticipant',
        model: db.VesselParticipant,
        required: true,
        attributes: ['id'],
        include: [
          {
            as: 'group',
            model: db.VesselParticipantGroup,
            required: true,
            attributes: ['id'],
            include: [
              {
                as: 'competitionUnit',
                model: db.CompetitionUnit,
                attributes: ['id'],
                required: true,
                where: {
                  id: competitionUnitId,
                },
              },
            ],
          },
        ],
      },
    ],
  });

  return result?.toJSON();
};

exports.setStartedStreamFlag = async (crewId) => {
  db.VesselParticipantCrew.update(
    { startedStream: true },
    {
      where: {
        id: crewId,
      },
    },
  );
};
