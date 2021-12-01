const db = require('../../index');
const { Op } = require('../../index');

exports.getFollowers = async (paging, { userId, status }) => {
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
        },
      ],
      where,
    },
    paging,
  );
  return result;
};

exports.getFollowing = async (paging, { followerId, status }) => {
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
        },
      ],
      where,
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

exports.delete = async ({ userId, followerId }, transaction) => {
  const deleteCount = await db.UserFollower.destroy({
    where: {
      userId,
      followerId,
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
