const db = require('../../index');

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.UserSetting.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.insert = async (data, transaction) => {
  const result = await db.UserSetting.create(data, { transaction });
  return result;
};

exports.getById = async (userId) => {
  const settings = await db.UserSetting.findByPk(userId);
  return settings.toJSON();
};

exports.update = async (id, data, transaction) => {
  const [updateCount, updatedData] = await db.UserSetting.update(data, {
    where: {
      id,
    },
    returning: true,
    transaction,
  });

  return { updateCount, updatedData };
};

exports.delete = async (id, transaction) => {
  const data = await db.UserSetting.findByPk(id);

  if (data) {
    await db.UserSetting.destroy({
      where: {
        id,
      },
      transaction,
    });
  }

  return data?.toJSON();
};
