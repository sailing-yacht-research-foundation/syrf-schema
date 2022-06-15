const db = require('../../index');

exports.getLegsByCompetitionUnit = async (id, timeFrom, timeTo) => {
  if (!id) return null;

  let condition = {
    competitionUnitId: id,
  };

  if (!isNaN(timeFrom?.getTime()) && !isNaN(timeTo?.getTime()))
    condition.startTime = {
      [db.Op.between]: [timeFrom, timeTo],
    };

  const result = await db.VesselParticipantLeg.findAll({
    where: condition,
    attributes: {
      exclude: ['id', 'competitionUnitId'],
    },
    order: [
      ['vesselParticipantId', 'ASC'],
      ['startTime', 'ASC'],
    ],
    raw: true,
  });

  return result;
};

exports.getEventsByCompetitionUnit = async (id, timeFrom, timeTo) => {
  if (!id) return null;

  let condition = {
    competitionUnitId: id,
  };

  if (!isNaN(timeFrom?.getTime()) && !isNaN(timeTo?.getTime()))
    condition.eventTime = {
      [db.Op.between]: [timeFrom, timeTo],
    };

  const result = await db.VesselParticipantEvent.findAll({
    where: condition,
    attributes: {
      exclude: ['id', 'competitionUnitId'],
    },
    order: [
      ['vesselParticipantId', 'ASC'],
      ['eventTime', 'ASC'],
    ],
    raw: true,
  });

  return result;
};

exports.getCompetitionUnitResult = async (id) => {
  if (!id) return null;

  const result = await db.CompetitionResult.findAll({
    where: {
      competitionUnitId: id,
    },
    attributes: {
      exclude: ['id', 'competitionUnitId'],
    },
    order: [['rank', 'ASC']],
    raw: true,
  });

  return result;
};

exports.getLegsByVesselParticipant = async (id, timeFrom, timeTo) => {
  if (!id) return null;

  let condition = {
    vesselParticipantId: id,
  };

  if (!isNaN(timeFrom?.getTime()) && !isNaN(timeTo?.getTime()))
    condition.startTime = {
      [db.Op.between]: [timeFrom, timeTo],
    };

  const result = await db.VesselParticipantLeg.findAll({
    where: condition,
    attributes: {
      exclude: ['id', 'competitionUnitId', 'vesselParticipantId'],
    },
    order: [['startTime', 'ASC']],
    raw: true,
  });

  return result;
};

exports.getEventsByVesselParticipant = async (id, timeFrom, timeTo) => {
  if (!id) return null;

  let condition = {
    vesselParticipantId: id,
  };

  if (!isNaN(timeFrom?.getTime()) && !isNaN(timeTo?.getTime()))
    condition.eventTime = {
      [db.Op.between]: [timeFrom, timeTo],
    };

  const result = await db.VesselParticipantEvent.findAll({
    where: condition,
    attributes: {
      exclude: ['id', 'competitionUnitId', 'vesselParticipantId'],
    },
    order: [['eventTime', 'ASC']],
    raw: true,
  });

  return result;
};

exports.getJsonTracksByVP = async (id) => {
  if (!id) return null;

  const result = await db.VesselParticipantTrackJson.findOne({
    where: {
      vesselParticipantId: id,
    },
  });

  return result?.toJSON();
};

exports.getJsonTracksByCU = async (id) => {
  if (!id) return null;

  const result = await db.VesselParticipantTrackJson.findAll({
    where: {
      competitionUnitId: id,
    },
    raw: true,
  });

  return result;
};

exports.getVPTrackJsonsByRaceId = async (competitionUnitId) => {
  return db.VesselParticipantTrackJson.findAll({
    where: {
      competitionUnitId,
    },
    raw: true,
  });
};

exports.getPointTrackJsonsByRaceId = async (competitionUnitId) => {
  return db.CompetitionPointTrackJson.findAll({
    where: {
      competitionUnitId,
    },
    raw: true,
  });
};
