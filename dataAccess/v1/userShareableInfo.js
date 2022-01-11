const db = require('../../index');

exports.upsert = async (data, transaction) => {
  const [result] = await db.UserShareableInfo.upsert(data, { transaction });

  return result.toJSON();
};

exports.update = async (userId, data = {}, transaction) => {
  const result = await db.UserShareableInfo.update(data, {
    where: {
      userId,
    },
    transaction,
  });

  return result;
};

exports.getById = async (id) => {
  return await db.UserShareableInfo.findByPk(id, {
    raw: true,
  });
};

exports.delete = async (userId, transaction) => {
  const data = await db.UserShareableInfo.findByPk(userId);

  if (data) {
    await db.UserShareableInfo.destroy({
      where: {
        userId,
      },
      transaction,
    });
  }

  return data?.toJSON();
};
