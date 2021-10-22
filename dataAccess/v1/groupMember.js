const uuid = require('uuid');
const db = require('../../index');
const { Op } = require('../../index');

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
];

exports.getById = async (id) => {
  const result = await db.GroupMember.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.getByEmails = async (groupId, emails) => {
  const result = await db.GroupMember.findAll({
    where: {
      groupId,
      email: {
        [Op.in]: emails,
      },
    },
  });

  return result;
};

exports.getByUserAndGroup = async (userId, groupId) => {
  const result = await db.GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
    attributes: ['id', 'status', 'joinDate', 'isAdmin'],
    include: [
      {
        as: 'member',
        model: db.UserProfile,
        attributes: ['id', 'name', 'email'],
      },
    ],
  });
  return result;
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

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.GroupMember.bulkCreate(data, {
    updateOnDuplicate: ['status'],
    validate: true,
    transaction,
  });
  return result;
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

exports.getGroupsByUserId = async (paging, { userId, status }) => {
  const where = paging.query
    ? {
        '$group.groupName$': {
          [db.Op.like]: `%${paging.query}%`,
        },
        userId,
        status,
      }
    : {
        userId,
        status,
      };

  const result = await db.GroupMember.findAllWithPaging(
    {
      where,
      attributes: ['id', 'status', 'joinDate', 'isAdmin'],
      include: [
        {
          as: 'group',
          model: db.Group,
          attributes: [
            'id',
            'groupName',
            'groupType',
            'description',
            'visibility',
          ],
        },
      ],
    },
    paging,
  );
  return result;
};

exports.getUsersByGroupId = async (paging, { groupId, status }) => {
  const where = paging.query
    ? {
        '$member.name$': {
          [db.Op.like]: `%${paging.query}%`,
        },
        groupId,
        status,
      }
    : {
        groupId,
        status,
      };

  const result = await db.GroupMember.findAllWithPaging(
    {
      attributes: ['id', 'status', 'joinDate', 'isAdmin'],
      where,
      include: [
        {
          as: 'member',
          model: db.UserProfile,
          attributes: ['id', 'name', 'email'],
        },
      ],
    },
    paging,
  );
  return result;
};
