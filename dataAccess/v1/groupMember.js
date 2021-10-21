const uuid = require('uuid');
const db = require('../../index');
const { includeMeta } = require('../../utils/utils');

const include = [
  {
    as: 'group',
    model: db.Group,
    attributes: ['id', 'groupName', 'groupType'],
  },
  {
    as: 'member',
    model: db.UserProfile,
    attributes: ['id', 'name', 'email'],
  },
  ...includeMeta,
];

exports.getAll = async (paging, groupId) => {
  const where = paging.query
    ? {
        '$member.name$': {
          [db.Op.like]: `%${paging.query}%`,
        },
        groupId,
      }
    : {
        groupId,
      };

  const result = await db.GroupMember.findAllWithPaging(
    { where, include },
    paging,
  );
  return result;
};

exports.getById = async (id) => {
  const result = await db.GroupMember.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.upsert = async (id, data = {}, transaction) => {
  if (!id) id = uuid.v4();

  let options;
  if (transaction) {
    options = { transaction };
  }
  const [result] = await db.GroupMember.upsert({ ...data, id }, options);

  return result?.toJSON();
};

exports.delete = async (id, transaction) => {
  const data = await db.GroupMember.findByPk(id, {
    include,
  });

  if (data) {
    await db.GroupMember.destroy({
      where: {
        id,
      },
      transaction,
    });
  }

  return data?.toJSON();
};
