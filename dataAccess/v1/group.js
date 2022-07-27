const uuid = require('uuid');
const {
  groupVisibilities,
  groupMemberStatus,
  groupTypes,
} = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');

exports.getAll = async (paging, { visibilities, userId, excludeBlocked }) => {
  let where = Object.assign(
    {},
    {
      visibility: {
        [Op.in]: visibilities,
      },
    },
    excludeBlocked
      ? {
          [Op.or]: [
            {
              '$groupMember.status$': {
                [Op.ne]: groupMemberStatus.blocked,
              },
            },
            {
              '$groupMember.status$': {
                [Op.is]: null,
              },
            },
          ],
        }
      : {},
  );

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
            db.Sequelize.literal(
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
      subQuery: false,
    },
    paging,
  );
  return result;
};

exports.getById = async (id) => {
  const result = await db.Group.findByPk(id);

  return result?.toJSON();
};

exports.getByIds = async (ids = [], attributes) => {
  if (ids.length === 0) {
    return [];
  }
  const result = await db.Group.findAll({
    where: {
      id: {
        [db.Op.in]: ids,
      },
    },
    attributes,
    raw: true,
  });

  return result;
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

exports.update = async (id, data, transaction) => {
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

    await db.CalendarGroupEditor.destroy({
      where: {
        groupId: id,
      },
      transaction,
    });
    await db.VesselGroupEditor.destroy({
      where: {
        groupId: id,
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

  await db.CalendarGroupEditor.destroy({
    where: {
      groupId: {
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

exports.getByStripeConnectedAccount = async (stripeConnectedAccountId) => {
  const result = await db.Group.findOne({
    where: {
      stripeConnectedAccountId,
    },
  });

  return result?.toJSON();
};

exports.getValidOrganizerGroup = async (userId) => {
  const result = await db.Group.findAll({
    where: {
      groupType: groupTypes.organization,
    },
    attributes: ['id', 'groupName', 'groupImage', 'visibility', 'groupType'],
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
  });
  return result;
};
