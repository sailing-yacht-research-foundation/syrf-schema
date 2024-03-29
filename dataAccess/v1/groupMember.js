const uuid = require('uuid');
const { QueryTypes } = require('sequelize');
const { addDays } = require('date-fns');
const { groupMemberStatus, miscOptionsValue } = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');

const include = [
  {
    as: 'group',
    model: db.Group,
    attributes: ['id', 'groupName', 'groupType', 'groupImage', 'visibility'],
  },
  {
    as: 'member',
    model: db.UserProfile,
    attributes: ['id', 'name', 'email', 'avatar'],
  },
];

exports.getAll = async (paging, groupId) => {
  let where = {
    groupId,
  };

  if (paging.query) {
    where['$member.name$'] = {
      [db.Op.iLike]: `%${paging.query}%`,
    };
  }

  const result = await db.GroupMember.findAllWithPaging(
    {
      where,
      include: {
        as: 'member',
        model: db.UserProfile,
        attributes: ['id', 'name', 'avatar'],
      },
    },
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

exports.deleteByGroup = async (groupId, transaction) => {
  const result = await db.GroupMember.destroy({
    where: {
      groupId,
    },
    transaction,
  });
  return result;
};

exports.deleteByUserId = async (userId, transaction) => {
  const result = await db.GroupMember.destroy({
    where: {
      userId,
    },
    transaction,
  });
  return result;
};

exports.deleteStaleInvitation = async (transaction) => {
  const checkDate = addDays(
    new Date(),
    miscOptionsValue.staleInvitationDuration,
  );
  const deletedInvitations = await db.GroupMember.destroy({
    where: {
      userId: { [Op.eq]: null },
      status: groupMemberStatus.invited,
      createdAt: {
        [Op.lt]: checkDate.toISOString(),
      },
    },
    transaction,
  });
  return deletedInvitations;
};

exports.getGroupsByUserId = async (paging, { userId, status }) => {
  const where = paging.query
    ? {
        '$group.groupName$': {
          [db.Op.iLike]: `%${paging.query}%`,
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
      attributes: {
        include: [
          [
            db.Sequelize.literal(
              `(SELECT COUNT(*) FROM "GroupMembers" AS "member" WHERE "GroupMember"."groupId" = "member"."groupId" AND "status" = :status)`,
            ),
            'memberCount',
          ],
        ],
        exclude: [
          'invitorId',
          'createdAt',
          'updatedAt',
          'groupId',
          'userId',
          'email',
        ],
      },
      include: [
        {
          as: 'group',
          model: db.Group,
          attributes: [
            'id',
            'groupName',
            'groupImage',
            'groupType',
            'description',
            'visibility',
          ],
        },
      ],
      replacements: {
        status: groupMemberStatus.accepted,
      },
    },
    paging,
  );
  return result;
};

exports.getUsersByGroupId = async (paging, { groupId, status }) => {
  const where = paging.query
    ? {
        '$member.name$': {
          [db.Op.iLike]: `%${paging.query}%`,
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
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    },
    paging,
  );
  return result;
};

exports.getGroupAdmins = async (groupId) => {
  const result = await db.GroupMember.findAll({
    where: {
      groupId,
      status: groupMemberStatus.accepted,
      isAdmin: true,
    },
    attributes: ['id', 'userId', 'isAdmin', 'status'],
  });

  return result;
};

exports.getGroupSize = async (groupId) => {
  const groupSize = await db.GroupMember.count({
    where: {
      groupId,
      status: groupMemberStatus.accepted,
    },
  });

  return groupSize;
};

exports.getGroupMemberSummaries = async (
  groupIds,
  numberOfMemberToFetch = 5,
) => {
  if (groupIds.length === 0) {
    return [];
  }
  const replacements = {
    groupIds,
    status: groupMemberStatus.accepted,
    numberOfMemberToFetch,
  };
  const result = await db.sequelize.query(
    `SELECT "numberedMember"."id", "groupId", "userId", "isAdmin", "UserProfiles"."avatar", "UserProfiles"."name" 
      FROM ( 
        SELECT "id", "groupId", "userId", "isAdmin", ROW_NUMBER ( ) OVER ( PARTITION BY "groupId" ORDER BY "joinDate" ASC ) AS "numbering" 
        FROM "GroupMembers" WHERE "status" = :status
      ) AS "numberedMember"
      JOIN "UserProfiles" ON ( "numberedMember"."userId" = "UserProfiles"."id" ) 
      WHERE "groupId" IN (:groupIds) AND "numbering" <= :numberOfMemberToFetch`,
    {
      type: QueryTypes.SELECT,
      replacements,
    },
  );
  return result;
};

exports.getAllGroupsOfUser = async (userId) => {
  const result = await db.GroupMember.findAll({
    where: { userId },
    attributes: ['id', 'groupId', 'status', 'joinDate', 'isAdmin'],
    raw: true,
  });
  return result;
};

exports.update = async ({ id, status, userId }, data, transaction) => {
  const [updateCount] = await db.GroupMember.update(data, {
    where: {
      id,
      status,
      userId,
    },
    transaction,
  });

  return updateCount;
};

exports.addGroupMemberAsEditors = async (
  groupId,
  calendarEventId,
  transaction,
) => {
  // Fetch all user id of the group
  const users = await db.GroupMember.findAll({
    where: { groupId, status: groupMemberStatus.accepted },
    attributes: ['userId'],
    raw: true,
  });
  const data = users.map((row) => {
    return { UserProfileId: row.userId, CalendarEventId: calendarEventId };
  });
  const result = await db.CalendarEditor.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.updateUserlessInvitations = async (userId, email, transaction) => {
  const [updateCount] = await db.GroupMember.update(
    { userId },
    {
      where: {
        email,
        userId: { [Op.eq]: null },
      },
      transaction,
    },
  );

  return updateCount;
};

exports.getCurrentAcceptedMembers = async (groupIds) => {
  const users = await db.GroupMember.findAll({
    where: {
      groupId: {
        [Op.in]: groupIds,
      },
      status: groupMemberStatus.accepted,
    },
    attributes: ['userId'],
    raw: true,
  });
  return [...new Set(users.map((row) => row.userId))];
};

exports.getMembersById = async (groupId) => {
  groupId = Array.isArray(groupId) ? groupId : [groupId];

  const result = await db.GroupMember.findAll({
    where: {
      groupId: {
        [db.Op.in]: groupId,
      },
      status: groupMemberStatus.accepted,
    },
    attributes: ['id', 'groupId', 'status', 'joinDate', 'isAdmin', 'userId'],
    include: [
      {
        model: db.UserProfile,
        as: 'member',
        attributes: ['id', 'name', 'avatar'],
      },
    ],
  });
  return result.map((t) => t.toJSON());
};

exports.getGroupsByUserWithoutPaging = async ({
  userId,
  status,
  groupQuery,
}) => {
  const result = await db.GroupMember.findAll({
    where: {
      userId,
      status,
    },
    attributes: {
      include: [
        [
          db.Sequelize.literal(
            `(SELECT COUNT(*) FROM "GroupMembers" AS "member" WHERE "GroupMember"."groupId" = "member"."groupId" AND "status" = :status)`,
          ),
          'memberCount',
        ],
      ],
      exclude: [
        'invitorId',
        'createdAt',
        'updatedAt',
        'groupId',
        'userId',
        'email',
      ],
    },
    include: [
      {
        as: 'group',
        model: db.Group,
        attributes: [
          'id',
          'groupName',
          'groupImage',
          'groupType',
          'description',
          'visibility',
        ],
        where: groupQuery,
        required: !!groupQuery,
      },
    ],
    replacements: {
      status: groupMemberStatus.accepted,
    },
  });
  return result;
};

exports.getGroupMembersByUserIds = async (groupId, userIds) => {
  const result = await db.GroupMember.findAll({
    where: {
      groupId,
      userId: {
        [db.Op.in]: userIds,
      },
    },
    include: {
      as: 'member',
      model: db.UserProfile,
      attributes: ['id', 'name', 'avatar'],
    },
  });
  return result;
};
