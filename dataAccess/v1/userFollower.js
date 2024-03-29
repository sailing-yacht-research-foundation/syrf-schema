const { followerStatus } = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');
const { addHours } = require('date-fns');

const VELOCITY_TIME_OFFSET = -48;

exports.getFollowers = async (paging, { userId, status, reqUserId }) => {
  let where = {
    userId,
    status,
  };

  if (paging.query) {
    where['$follower.name$'] = {
      [Op.iLike]: `%${paging.query}%`,
    };
  }

  const result = await db.UserFollower.findAllWithPaging(
    {
      include: [
        {
          as: 'follower',
          model: db.UserProfile,
          attributes: ['id', 'name', 'email', 'avatar'],
          required: true,
          include: [
            {
              as: 'follower',
              model: db.UserFollower,
              attributes: ['status'],
              required: false,
              where: {
                followerId: reqUserId,
              },
            },
          ],
        },
      ],
      where,
      subQuery: false,
    },
    paging,
  );
  return result;
};

exports.getFollowing = async (paging, { followerId, status, reqUserId }) => {
  let where = {
    followerId,
    status,
  };

  if (paging.query) {
    where['$following.name$'] = {
      [Op.iLike]: `%${paging.query}%`,
    };
  }

  const result = await db.UserFollower.findAllWithPaging(
    {
      include: [
        {
          as: 'following',
          model: db.UserProfile,
          attributes: ['id', 'name', 'email', 'avatar'],
          required: true,
          include: [
            {
              as: 'follower',
              model: db.UserFollower,
              attributes: ['status'],
              required: false,
              where: {
                followerId: reqUserId,
              },
            },
          ],
        },
      ],
      where,
      subQuery: false,
    },
    paging,
  );
  return result;
};

exports.getByValues = async (userId, followerId) => {
  const result = await db.UserFollower.findOne({
    where: {
      userId,
      followerId,
    },
  });

  return result;
};

exports.getBulkIsFollowed = async (userIdList, followerId) => {
  const result = await db.UserFollower.findAll({
    where: {
      userId: {
        [Op.in]: userIdList,
      },
      followerId,
    },
  });

  return result;
};

exports.insert = async ({ userId, followerId, status }, transaction) => {
  let options;
  if (transaction) {
    options = { transaction };
  }
  const result = await db.UserFollower.create(
    {
      userId,
      followerId,
      status,
    },
    options,
  );

  return result;
};

exports.update = async ({ userId, followerId, status }, transaction) => {
  const [updateCount] = await db.UserFollower.update(
    { status },
    {
      where: {
        userId,
        followerId,
      },
      transaction,
    },
  );

  return updateCount;
};

exports.upsert = async (data, transaction) => {
  const [result] = await db.UserFollower.upsert(data, { transaction });

  return result?.toJSON();
};

exports.delete = async ({ userId, followerId, status }, transaction) => {
  const deleteCount = await db.UserFollower.destroy({
    where: {
      userId,
      followerId,
      status,
    },
    transaction,
  });

  return deleteCount;
};

// For deleting all user follow and following, when user delete their account
exports.deleteUserReference = async (userId, transaction) => {
  const deleteCount = await db.UserFollower.destroy({
    where: {
      [Op.or]: [
        {
          userId,
        },
        {
          followerId: userId,
        },
      ],
    },
    transaction,
  });

  return deleteCount;
};

exports.getFollowSummary = async (userId) => {
  const followingCount = await db.UserFollower.count({
    where: {
      followerId: userId,
      status: followerStatus.accepted,
    },
  });
  const followerCount = await db.UserFollower.count({
    where: {
      userId,
      status: followerStatus.accepted,
    },
  });
  return {
    followerCount,
    followingCount,
  };
};

exports.getTopCountryUser = async (paging, { country, userId }) => {
  let where = Object.assign({}, country ? { country } : {}, {
    ['$follower.followerId$']: {
      [Op.eq]: null, // Only show top user not followed yet
    },
    [Op.or]: [
      {
        ['$following.userId$']: {
          [Op.eq]: null, // Show top user not following the user
        },
      },
      {
        ['$following.status$']: {
          [Op.ne]: followerStatus.blocked, // Only show user not blocked yet
        },
      },
    ],
    id: {
      [Op.ne]: userId, // Exclude the requesting user
    },
  });

  const result = await db.UserProfile.findAllWithPaging(
    {
      attributes: [
        'id',
        'name',
        'avatar',
        'isPrivate',
        'country',
        [
          db.Sequelize.literal(
            `(SELECT COUNT(*) FROM "UserFollowers" AS "folDB" WHERE "UserProfile"."id" = "folDB"."userId" AND "folDB"."status" = '${followerStatus.accepted}')`,
          ),
          'followerCount',
        ],
      ],
      include: [
        {
          as: 'follower',
          model: db.UserFollower,
          attributes: [],
          required: false,
          where: {
            followerId: userId,
          },
        },
        {
          as: 'following',
          model: db.UserFollower,
          attributes: [],
          required: false,
          where: {
            userId,
          },
        },
      ],
      where,
      subQuery: false,
    },
    {
      ...paging,
      defaultSort: [[db.Sequelize.literal('"followerCount"'), 'DESC']],
    },
  );
  return result;
};

exports.getTopVelocityUser = async (paging, { country, userId }) => {
  let where = Object.assign({}, country ? { country } : {}, {
    ['$follower.followerId$']: {
      [Op.eq]: null, // Only show top gaining follower that user not followed / request (if private) to follow yet
    },
    [Op.or]: [
      {
        ['$following.userId$']: {
          [Op.eq]: null, // Show top user not following the user
        },
      },
      {
        ['$following.status$']: {
          [Op.ne]: followerStatus.blocked, // Only show user not blocked yet
        },
      },
    ],
    id: {
      [Op.ne]: userId, // Exclude the requesting user
    },
  });
  const checkDate = addHours(new Date(), parseInt(VELOCITY_TIME_OFFSET));
  const result = await db.UserProfile.findAllWithPaging(
    {
      attributes: [
        'id',
        'name',
        'avatar',
        'isPrivate',
        'country',
        [
          db.Sequelize.literal(
            `(SELECT COUNT(*) FROM "UserFollowers" AS "folDB" WHERE "UserProfile"."id" = "folDB"."userId" AND "folDB"."status" = '${
              followerStatus.accepted
            }' AND "folDB"."updatedAt" >= '${checkDate.toISOString()}')`,
          ),
          'followerGained',
        ],
      ],
      include: [
        {
          as: 'follower',
          model: db.UserFollower,
          attributes: [],
          required: false,
          where: {
            followerId: userId,
          },
        },
        {
          as: 'following',
          model: db.UserFollower,
          attributes: [],
          required: false,
          where: {
            userId,
          },
        },
      ],
      where,
      subQuery: false,
    },
    {
      ...paging,
      defaultSort: [[db.Sequelize.literal('"followerGained"'), 'DESC']],
    },
  );
  return result;
};

// Note: Dirty solution for returning people I follow first
// Searching by name, but only return the followed (will be combined with es result)
exports.searchFollowedUser = async ({ page, size, name }, userId) => {
  const result = await db.UserProfile.findAndCountAll({
    attributes: [
      'id',
      'name',
      'avatar',
      'isPrivate',
      'country',
      'bio',
      'sailingNumber',
    ],
    include: [
      {
        as: 'follower',
        model: db.UserFollower,
        attributes: [],
        required: true,
        where: {
          followerId: userId,
          status: followerStatus.accepted,
        },
      },
    ],
    where: {
      name: {
        [Op.iLike]: `%${name}%`,
      },
    },
    subQuery: false,
    limit: size,
    offset: (page - 1) * size,
  });
  return result;
};

exports.getBidirectionalFollowStatus = async (targetUser, requester) => {
  const result = await db.UserFollower.findAll({
    where: {
      [Op.or]: [
        { userId: targetUser, followerId: requester },
        { userId: requester, followerId: targetUser },
      ],
    },
    attributes: ['userId', 'followerId', 'status'],
    raw: true,
  });
  let isBlocking = false;
  let isBlocked = false;
  let followStatus = null;
  result.forEach((row) => {
    if (row.userId === requester && row.status === followerStatus.blocked) {
      // Requesting user blocks the profile
      isBlocking = true;
    }
    if (row.followerId === requester && row.status === followerStatus.blocked) {
      // Profile owner blocks the user
      isBlocked = true;
    }
    if (row.followerId === requester) {
      followStatus = row.status;
    }
  });
  return {
    isBlocking,
    isBlocked,
    followStatus,
  };
};
