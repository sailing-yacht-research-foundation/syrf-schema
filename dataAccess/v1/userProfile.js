const db = require('../../index');

exports.upsert = async (userProfile = {}, transaction) => {
  const [result] = await db.UserProfile.upsert({
    ...userProfile,
  }, { transaction });

  return result.toJSON();
};

exports.updateProfile = async (userId, userProfile = {}, transaction) => {
  const result = await db.UserProfile.update(userProfile, {
    where: {
      id: userId,
    },
    transaction
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

exports.delete = async (sub, transaction) => {
  const data = await db.UserProfile.findByPk(sub);

  if (data) {
    await db.UserProfile.destroy({
      where: {
        id: sub,
      },
      transaction
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
