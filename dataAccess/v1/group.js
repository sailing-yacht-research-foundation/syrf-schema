const uuid = require('uuid');
const db = require('../../index');
const { includeMeta } = require('../../utils/utils');

exports.getAll = async (paging, groupType) => {
  let where = {};

  if (paging.query) {
    where.groupName = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  if (groupType) {
    where.groupType = groupType;
  }

  const result = await db.Group.findAllWithPaging(
    { where, include: [...includeMeta] },
    paging,
  );
  return result;
};

exports.getById = async (id) => {
  const result = await db.Group.findByPk(id, {
    include: [...includeMeta],
  });

  return result?.toJSON();
};

exports.upsert = async (id, data = {}, transaction) => {
  if (!id) id = uuid.v4();

  let options;
  if (transaction) {
    options = { transaction };
  }
  const [result] = await db.Group.upsert({ ...data, id }, options);

  return result?.toJSON();
};

exports.delete = async (id, transaction) => {
  const data = await db.Group.findByPk(id);

  if (data) {
    await db.Group.destroy({
      where: {
        id,
      },
      transaction,
    });
  }

  return data?.toJSON();
};
