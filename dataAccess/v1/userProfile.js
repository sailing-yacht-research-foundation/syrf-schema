const db = require('../../index');

exports.upsert = async (userProfile = {}) => {
  const [result] = await db.UserProfile.upsert({
    ...userProfile,
  });

  return result.toJSON();
};

exports.updateProfile = async (userId, userProfile = {}) => {
  const result = await db.UserProfile.update(userProfile, {
    where: {
      id: userId,
    },
  });

  return result;
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

exports.delete = async (sub) => {
  const data = await db.UserProfile.findByPk(sub);

  if (data) {
    await db.UserProfile.destroy({
      where: {
        id: sub,
      },
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
