const db = require('../../index');
const { Op } = require('../../index');

exports.getStreams = async (paging, { competitionUnitId, isLive }) => {
  let where = Object.assign(
    {},
    { isLive },
    competitionUnitId ? { competitionUnitId } : {},
  );

  if (paging.query) {
    where['$user.name$'] = {
      [Op.iLike]: `%${paging.query}%`,
    };
  }

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
      where,
    },
    paging,
  );
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
  id,
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
    where: {
      id,
    },
    transaction,
  });

  return updateCount;
};
