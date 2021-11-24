const db = require('../../index');

exports.getCurrent = async (userId) => {
  const result = await db.CompetitionUnit.findAll({
    where: {
      createdById: userId,
      isCompleted: false,
      endTime: {
        [db.Op.eq]: null,
      },
    },
    include: [
      {
        model: db.CalendarEvent,
        as: 'calendarEvent',
        required: true,
        where: {
          isPrivate: true,
        },
      },
    ],
    limit: 1,
    order: [['createdAt', 'DESC']],
  });

  if (result.length === 0) return null;

  const competition = result[0].toJSON();
  const event = competition.calendarEvent;

  const participant = (
    await db.Participant.findOne({
      where: {
        userProfileId: userId,
        calendarEventId: event.id,
      },
      include: [
        {
          model: db.VesselParticipant,
          as: 'vesselParticipants',
          through: {
            attributes: [],
          },
          include: [
            {
              model: db.Vessel,
              as: 'vessel',
            },
          ],
        },
      ],
    })
  )?.toJSON();

  if (!participant) return null;

  return {
    competitionUnit: { ...competition, calendarEvent: null },
    calendarEvent: event,
    participant: { ...participant, vesselParticipants: null },
    vesselParticipant: { ...participant?.vesselParticipants[0] },
    vessel: participant?.vesselParticipants[0]?.vessel,
  };
};

exports.getUnstoppedCU = async (userId) => {
  const result = await db.CompetitionUnit.findAll({
    attributes: ['id'],
    where: {
      createdById: userId,
      isCompleted: false,
      endTime: {
        [db.Op.eq]: null,
      },
    },
    include: [
      {
        model: db.CalendarEvent,
        as: 'calendarEvent',
        attributes: [],
        required: true,
        where: {
          isPrivate: true,
        },
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return result;
};
