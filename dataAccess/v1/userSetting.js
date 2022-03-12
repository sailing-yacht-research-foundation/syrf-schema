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
