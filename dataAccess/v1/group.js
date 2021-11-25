const uuid = require('uuid');
const { groupVisibilities, groupMemberStatus } = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');

exports.getAll = async (paging, { visibilities, userId }) => {
  let where = {
    visibility: {
      [Op.in]: visibilities,
    },
  };

  if (paging.query) {
    where.groupName = {
      [db.Op.iLike]: `%${paging.query}%`,
    };
  }

  const result = await db.Group.findAllWithPaging(
    {
      attributes: {
        include: [
          [
            db.sequelize.literal(
              `(SELECT COUNT(*) FROM "GroupMembers" AS "member" WHERE "Group"."id" = "member"."groupId")`,
            ),
            'memberCount',
          ],
        ],
      },
      include: [
        {
          as: 'groupMember',
          model: db.GroupMember,
          attributes: ['status', 'isAdmin'],
          required: false,
          where: {
            userId,
          },
        },
      ],
      where,
    },
    paging,
  );
  return result;
};

exports.getById = async (id) => {
  const result = await db.Group.findByPk(id);

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

exports.update = async (id, data = {}, transaction) => {
  const [updateCount] = await db.Group.update(data, {
    where: {
      id,
    },
    transaction,
  });

  return updateCount;
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

exports.bulkDelete = async (idList, transaction) => {
  const delCount = await db.Group.destroy({
    where: {
      id: {
        [Op.in]: idList,
      },
    },
    transaction,
  });
  return delCount;
};

exports.addGroupAsAdmin = async (groupId, calendarEventId, transaction) => {
  await db.CalendarGroupEditor.create(
    {
      groupId,
      calendarEventId,
    },
    { transaction },
  );
};

exports.removeGroupFromAdmin = async (
  groupId,
  calendarEventId,
  transaction,
) => {
  const deletedCount = await db.CalendarGroupEditor.destroy({
    where: {
      groupId,
      calendarEventId,
    },
    transaction,
  });
  return deletedCount;
};

// Need to limit the groups to private and moderated only
exports.getUserGroupsForInput = async (paging, userId) => {
  let where = {
    visibility: {
      [db.Op.in]: [groupVisibilities.private, groupVisibilities.moderated],
    },
  };
  if (paging.query) {
    where.groupName = { [db.Op.iLike]: `%${paging.query}%` };
  }

  const result = await db.Group.findAllWithPaging(
    {
      where,
      attributes: [
        'id',
        'groupName',
        'groupImage',
        'visibility',
        'groupType',
        'updatedAt',
      ],
      include: [
        {
          as: 'groupMember',
          model: db.GroupMember,
          attributes: ['status', 'isAdmin'],
          required: true,
          where: {
            userId,
            status: groupMemberStatus.accepted,
          },
        },
      ],
    },
    paging,
  );
  return result;
};
