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

exports.getById = async (sub) => {
  return await db.UserShareableInfo.findByPk(sub, {
    raw: true,
  });
};

exports.delete = async (id, transaction) => {
  const data = await db.UserShareableInfo.findByPk(id);

  if (data) {
    await db.UserShareableInfo.destroy({
      where: {
        id,
      },
      transaction,
    });
  }

  return data?.toJSON();
};
