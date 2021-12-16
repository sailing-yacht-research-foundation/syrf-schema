const db = require('../../index');
const { Op } = require('../../index');

exports.getStreams = async (paging) => {
  const result = await db.UserStream.findAllWithPaging(
    {
      include: [
        {
          as: 'user',
          model: db.UserProfile,
          attributes: ['id', 'name', 'avatar'],
          required: true,
        },
      ],
      where: Object.assign(
        {},
        paging.query
          ? {
              ['$user.name$']: {
                [Op.iLike]: `%${paging.query}%`,
              },
            }
          : {},
      ),
    },
    paging,
  );
  return result;
};

exports.getStreamByUser = async (userId, isLive) => {
  const result = await db.UserStream.findAll({
    where: Object.assign(
      {},
      { userId },
      isLive !== undefined ? { isLive } : {},
    ),
  });
  return result;
};

exports.getStreamByCompetition = async (competitionUnitId, isLive) => {
  const result = await db.UserStream.findAll({
    where: Object.assign(
      {},
      { competitionUnitId },
      isLive !== undefined ? { isLive } : {},
    ),
  });
  return result;
};

exports.getById = async (id) => {
  const result = await db.UserStream.findOne({
    where: {
      id,
    },
  });

  return result;
};

exports.insert = async (data, transaction) => {
  let options;
  if (transaction) {
    options = { transaction };
  }
  const {
    streamName,
    userId,
    isLive,
    competitionUnitId,
    ivsChannelArn,
    ivsChannelName,
    ivsIngestEndpoint,
    ivsPlaybackUrl,
    streamKey,
    streamKeyArn,
    privateStream = false,
    latencyMode,
    ivsType,
    saveRecording = false,
  } = data;
  const result = await db.UserStream.create(
    {
      userId,
      isLive,
      competitionUnitId,
      streamName,
      saveRecording,
      ivsChannelArn,
      ivsChannelName,
      ivsIngestEndpoint,
      ivsPlaybackUrl,
      streamKey,
      streamKeyArn,
      privateStream,
      latencyMode,
      ivsType,
    },
    options,
  );

  return result;
};

exports.update = async (
  { id, competitionUnitId },
  { latencyMode, ivsType, ivsChannelName, privateStream, isLive },
  transaction,
) => {
  const updateParams = Object.assign(
    {},
    ivsChannelName ? { ivsChannelName } : {},
    privateStream ? { privateStream } : {},
    isLive !== undefined ? { isLive } : {},
    latencyMode ? { latencyMode } : {},
    ivsType ? { ivsType } : {},
  );
  const [updateCount] = await db.UserStream.update(updateParams, {
    where: Object.assign(
      {},
      id ? { id } : {},
      competitionUnitId ? { competitionUnitId } : {},
    ),
    transaction,
  });

  return updateCount;
};

exports.bulkStopStream = async (idList, transaction) => {
  const [updateCount, affectedRows] = await db.UserStream.update(
    { isLive: false },
    {
      where: {
        id: {
          [db.Op.in]: idList,
        },
      },
      transaction,
      returning: true,
    },
  );

  return { updateCount, stoppedIds: affectedRows.map((row) => row.id) };
};
