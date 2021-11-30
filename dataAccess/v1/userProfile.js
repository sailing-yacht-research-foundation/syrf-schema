const { userSignupType } = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');
exports.upsert = async (userProfile = {}, transaction) => {
  const [result] = await db.UserProfile.upsert(
    {
      ...userProfile,
    },
    { transaction },
  );

  return result.toJSON();
};

exports.updateProfile = async (userId, userProfile = {}, transaction) => {
  const result = await db.UserProfile.update(userProfile, {
    where: {
      id: userId,
    },
    transaction,
  });

  return result;
};

exports.acceptEula = async (data, userId) => {
  const [updateCount] = await db.UserProfile.update(data, {
    where: {
      id: userId,
      signupType: userSignupType.REGISTERED,
    },
  });

  return updateCount;
};

exports.getById = async (sub) => {
  return await db.UserProfile.findByPk(sub, {
    raw: true,
  });
};

exports.getBySub = async (sub) => {
  return await db.UserProfile.findOne(
    { where: { sub } },
    {
      raw: true,
    },
  );
};

exports.getAllByEmail = async (emails) => {
  return await db.UserProfile.findAll({
    where: {
      email: {
        [Op.in]: emails,
      },
    },
    raw: true,
  });
};

exports.getAllById = async (ids) => {
  return await db.UserProfile.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    raw: true,
  });
};

exports.delete = async (sub, transaction) => {
  const data = await db.UserProfile.findByPk(sub);

  if (data) {
    await db.UserProfile.destroy({
      attributes: ['id', 'email', 'name'],
      where: {
        id: sub,
      },
      transaction,
    });
  }

  return data?.toJSON();
};

exports.clear = async () => {
  await db.UserProfile.destroy({
    truncate: true,
    cascade: true,
    force: true,
  });
};

exports.searchByEmailPhone = async ({ email, phone }, userId) => {
  let where = Object.assign(
    {},
    email
      ? {
          email,
        }
      : {},
    phone
      ? {
          phone_number: phone,
        }
      : {},
    {
      [Op.or]: [
        {
          isPrivate: false,
        },
        {
          isPrivate: true,
          ['$follower.followerId$']: {
            [Op.ne]: null,
          },
        },
      ],
    },
  );

  const result = await db.UserProfile.findOne({
    include: [
      {
        as: 'follower',
        model: db.UserFollower,
        attributes: ['followerId'],
        required: false,
        where: {
          followerId: userId,
        },
      },
    ],
    where,
    subQuery: false,
  });
  return result;
};
