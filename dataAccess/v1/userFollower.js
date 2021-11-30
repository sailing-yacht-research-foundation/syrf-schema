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
