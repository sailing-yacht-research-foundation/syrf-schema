const db = require('../../index');

exports.getTracksByCompetitionUnit = async (id, timeFrom, timeTo) => {
  if (!id) return null;

  const result = await db.VesselParticipantTrack.findAll({
    where: {
      competitionUnitId: id,
      pingTime: {
        [db.Op.between]: [timeFrom, timeTo],
      },
    },
    attributes: {
      exclude: ['id', 'competitionUnitId'],
    },
    order: [
      ['vesselParticipantId', 'ASC'],
      ['pingTime', 'ASC'],
    ],
    raw: true,
  });

  return result;
};

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

exports.getTracksByVesselParticipant = async (id, timeFrom, timeTo) => {
  if (!id) return null;

  const result = await db.VesselParticipantTrack.findAll({
    where: {
      vesselParticipantId: id,
      pingTime: {
        [db.Op.between]: [timeFrom, timeTo],
      },
    },
    attributes: {
      exclude: ['id', 'competitionUnitId', 'vesselParticipantId'],
    },
    order: [['pingTime', 'ASC']],
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

exports.getRaceTimeByCompetitionUnit = async (id) => {
  if (!id) return null;

  const result = await db.VesselParticipantTrack.findAll({
    where: {
      competitionUnitId: id,
    },
    attributes: [
      [db.Sequelize.fn('min', db.Sequelize.col('pingTime')), 'startTime'],
      [db.Sequelize.fn('max', db.Sequelize.col('pingTime')), 'endTime'],
    ],
  });

  return result[0];
};

exports.getRaceTimeByVesselParticipant = async (id) => {
  if (!id) return null;

  const result = await db.VesselParticipantTrack.findAll({
    where: {
      vesselParticipantId: id,
    },
    attributes: [
      [db.Sequelize.fn('min', db.Sequelize.col('pingTime')), 'startTime'],
      [db.Sequelize.fn('max', db.Sequelize.col('pingTime')), 'endTime'],
    ],
  });

  return result[0];
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
