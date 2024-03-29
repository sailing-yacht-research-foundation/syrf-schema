const uuid = require('uuid');
const {
  participantInvitationStatus,
  groupMemberStatus,
} = require('../../enums');
const db = require('../../index');
const { includeMeta, emptyPagingResponse } = require('../../utils/utils');

const include = [
  {
    model: db.UserProfile,
    as: 'editors',
    attributes: ['id', 'name', 'avatar'],
    through: {
      attributes: [],
    },
  },
  {
    model: db.Group,
    as: 'groupEditors',
    attributes: ['id', 'groupName', 'groupImage'],
    through: {
      attributes: [],
    },
    required: false,
    include: [
      {
        model: db.GroupMember,
        as: 'groupMember',
        attributes: ['id', 'userId'],
        required: false,
        include: [
          {
            as: 'member',
            model: db.UserProfile,
            attributes: ['name'],
          },
        ],
        where: {
          status: groupMemberStatus.accepted,
        },
      },
    ],
  },
  {
    model: db.UserProfile,
    as: 'owner',
    attributes: ['id', 'name', 'avatar'],
    required: false,
  },
  ...includeMeta,
];

exports.create = async (data, transaction) => {
  return await db.Vessel.create(data, {
    validate: true,
    transaction,
  });
};

exports.update = async (id, data, transaction) => {
  const [updateCount, updatedData] = await db.Vessel.update(data, {
    where: {
      id,
    },
    returning: true,
    transaction,
  });

  return { updateCount, updatedData };
};

exports.upsert = async (id, data = {}, transaction = undefined) => {
  if (!id) id = uuid.v4();

  let options;
  if (transaction) {
    options = { transaction };
  }
  const [result] = await db.Vessel.upsert(
    {
      ...data,
      id,
    },
    options,
  );

  return result?.toJSON();
};

exports.getAll = async (paging, params) => {
  let where = {};

  if (paging?.filters?.findIndex((t) => t.field === 'scope') < 0) {
    if (params?.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

  if (paging?.query) {
    where.publicName = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }
  const result = await db.Vessel.findAllWithPaging(
    {
      where,
    },
    paging,
  );

  return result;
};

exports.getById = async (id, { paranoid = true } = {}) => {
  const result = await db.Vessel.findByPk(id, {
    include,
    paranoid,
  });

  let data = result?.toJSON();
  if (data) {
    // Combining editors from groupEditors with regular editors
    const { editors, groupEditors } = data;
    let editorsFromGroup = [];
    groupEditors.forEach((group) => {
      editorsFromGroup = [
        ...editorsFromGroup,
        ...group.groupMember.map((row) => {
          return {
            id: row.userId,
            name: row.member?.name,
          };
        }),
      ];
    });
    data = {
      ...data,
      combinedEditors: [...editors, ...editorsFromGroup],
    };
  }
  return data;
};

exports.delete = async (id, { force = false } = {}, transaction) => {
  const data = await db.Vessel.findByPk(id, {
    include,
  });

  if (data) {
    await db.Vessel.destroy({
      where: {
        id: id,
      },
      force,
      transaction,
    });
  }

  return data?.toJSON();
};

exports.getAllForEvent = async (userId, eventId, paging = {}) => {
  let where = {
    [db.Op.or]: [
      {
        createdById: userId,
        bulkCreated: false,
      },
      {
        scope: eventId,
      },
    ],
  };

  if (paging.query) {
    where.publicName = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  const result = await db.Vessel.findAllWithPaging(
    {
      where,
    },
    paging,
  );

  return result;
};

const getRegisteredInEventSubQuery = `
(select 
  "vesselId"
from
  "VesselParticipants" AS "vp"
  INNER JOIN "VesselParticipantGroups" AS "vpg" ON "vp"."vesselParticipantGroupId" = "vpg"."id"
  AND "vpg"."calendarEventId" = $eventId)`
  .replace(/\n/g, ' ')
  .replace(/\t/g, ' ')
  .replace(/\s\s+/g, ' ');

exports.getAllRegisteredInEvent = async (eventId, paging = {}) => {
  let result = await db.Vessel.findAllWithPaging(
    {
      attributes: {
        exclude: ['orcJsonPolars'],
      },
      where: {
        id: {
          [db.Op.in]: db.Sequelize.literal(getRegisteredInEventSubQuery),
        },
      },
      bind: {
        eventId,
      },
    },
    paging,
  );

  const vpWithCrews = (
    await db.VesselParticipant.findAll({
      attributes: ['id', 'vesselId', 'sailNumber'],
      where: {
        vesselId: {
          [db.Op.in]: result.rows.map((t) => t.id),
        },
      },
      include: [
        {
          model: db.VesselParticipantGroup,
          as: 'group',
          attributes: [
            'id',
            'name',
            'vesselParticipantGroupId',
            'calendarEventId',
          ],
          where: {
            calendarEventId: eventId,
          },
        },
        {
          model: db.Participant,
          as: 'crews',
          attributes: ['id', 'publicName', 'invitationStatus'],
          through: {
            attributes: ['id'],
          },
          where: {
            invitationStatus: {
              [db.Op.in]: [
                participantInvitationStatus.ACCEPTED,
                participantInvitationStatus.SELF_REGISTERED,
              ],
            },
          },
          include: [
            {
              model: db.UserProfile,
              as: 'profile',
              attributes: ['id', 'name', 'country', 'avatar'],
            },
          ],
        },
      ],
    })
  ).map((t) => t.toJSON());

  result.rows = result.rows.map((t) => {
    const vessel = t.toJSON();
    const vesselParticipants = vpWithCrews.filter(
      (vp) => vp.vesselId === vessel.id,
    );
    return {
      ...vessel,
      sailNumber: vesselParticipants[0]?.sailNumber ?? vessel.sailNumber,
      vesselParticipants,
    };
  });

  return result;
};

exports.getByVesselIdAndSource = async (vesselIds, source) => {
  const where = {
    source,
  };
  if (vesselIds instanceof Array) {
    where.vesselId = {
      [db.Op.in]: vesselIds,
    };
  } else {
    where.vesselId = vesselIds;
  }
  return await db.Vessel.findAll({
    attributes: ['id', 'vesselId'],
    where,
  });
};

exports.bulkCreate = async (data, transaction) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.Vessel.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.bulkCreateWithOptions = async (data, options) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.Vessel.bulkCreate(data, options);
  return result;
};

exports.addEditors = async (vesselId, editors, transaction) => {
  if (editors.length === 0) {
    return [];
  }
  const result = await db.VesselEditor.bulkCreate(
    editors.map((userProfileId) => {
      return {
        vesselId,
        userProfileId,
      };
    }),
    {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    },
  );
  return result;
};

exports.addGroupEditors = async (vesselId, groupEditors, transaction) => {
  if (groupEditors.length === 0) {
    return [];
  }
  const result = await db.VesselGroupEditor.bulkCreate(
    groupEditors.map((groupId) => {
      return {
        vesselId,
        groupId,
      };
    }),
    {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    },
  );
  return result;
};

exports.removeAllEditors = async (vesselId, transaction) => {
  return await db.VesselEditor.destroy({
    where: {
      vesselId,
    },
    transaction,
  });
};

exports.removeAllGroupEditors = async (vesselId, transaction) => {
  return await db.VesselGroupEditor.destroy({
    where: {
      vesselId,
    },
    transaction,
  });
};

exports.validateAdminsById = async (id, userId) => {
  let result = {
    isOwner: false,
    isEditor: false,
    vessel: undefined,
  };
  if (id) {
    const vesselData = await db.Vessel.findByPk(id, {
      include: [
        {
          model: db.UserProfile,
          as: 'editors',
          attributes: ['id'],
          through: {
            attributes: [],
          },
        },
        {
          model: db.Group,
          as: 'groupEditors',
          attributes: ['id'],
          through: {
            attributes: [],
          },
          include: [
            {
              model: db.GroupMember,
              as: 'groupMember',
              attributes: ['id', 'userId'],
              where: {
                status: groupMemberStatus.accepted,
              },
            },
          ],
        },
      ],
      attributes: ['id', 'createdById', 'isDefaultVessel'],
    });

    let data = vesselData?.toJSON();
    if (data) {
      const { editors, groupEditors, createdById } = data;
      result.vessel = data;
      result.isOwner = createdById === userId;

      let editorsFromGroup = [];
      groupEditors.forEach((group) => {
        editorsFromGroup = [
          ...editorsFromGroup,
          ...group.groupMember.map((row) => {
            return {
              id: row.userId,
            };
          }),
        ];
      });
      const combinedEditors = [...editors, ...editorsFromGroup];
      result.isEditor =
        combinedEditors.findIndex((t) => t.id === userId) !== -1;
    }
  }

  return result;
};

exports.removeUsersFromEditor = async (vesselId, users, transaction) => {
  const deleteCount = await db.VesselEditor.destroy({
    where: {
      vesselId,
      userProfileId: {
        [db.Op.in]: users,
      },
    },
    transaction,
  });
  return deleteCount;
};

exports.removeGroupsFromEditor = async (vesselId, groups, transaction) => {
  const deleteCount = await db.VesselGroupEditor.destroy({
    where: {
      vesselId,
      groupId: {
        [db.Op.in]: groups,
      },
    },
    transaction,
  });
  return deleteCount;
};

exports.getUserVessels = async (paging, userId) => {
  let where = {
    [db.Op.and]: [
      {
        [db.Op.or]: [
          { createdById: userId },
          db.Sequelize.where(db.Sequelize.literal(`"editors"."id"`), {
            [db.Op.ne]: null,
          }),
          db.Sequelize.where(
            db.Sequelize.literal(`"groupEditors->groupMember"."userId"`),
            {
              [db.Op.ne]: null,
            },
          ),
        ],
      },
    ],
  };
  if (paging.query) {
    where[db.Op.or] = [
      {
        publicName: {
          [db.Op.iLike]: `%${paging.query}%`,
        },
      },
      {
        model: {
          [db.Op.iLike]: `%${paging.query}%`,
        },
      },
    ];
  }

  const result = await db.Vessel.findAllWithPaging(
    {
      include: [
        {
          model: db.UserProfile,
          as: 'editors',
          attributes: ['id', 'name', 'avatar'],
          through: {
            attributes: [],
          },
          where: {
            id: userId,
          },
          required: false,
        },
        {
          model: db.Group,
          as: 'groupEditors',
          attributes: ['id', 'groupName', 'groupImage'],
          through: {
            attributes: [],
          },
          include: [
            {
              model: db.GroupMember,
              as: 'groupMember',
              attributes: ['id', 'userId'],
              where: {
                userId,
                status: groupMemberStatus.accepted,
              },
            },
          ],
          required: false,
        },
        {
          model: db.UserProfile,
          as: 'owner',
          attributes: ['id', 'name', 'avatar'],
          required: true,
        },
      ],
      replacements: {
        userId,
      },
      where,
      subQuery: false,
    },
    paging,
  );
  const { count, rows, page, size } = result;

  const formattedRows = [];
  rows.forEach((row) => {
    const plainData = row.toJSON();
    formattedRows.push({
      ...plainData,
      isEditor: row.editors?.length > 0 || row.groupEditors?.length > 0,
    });
  });

  return {
    count,
    rows: formattedRows,
    page,
    size,
  };
};

exports.getBulkVesselEditors = async (idList) => {
  const individualEditors = await db.VesselEditor.findAll({
    where: {
      vesselId: {
        [db.Op.in]: idList,
      },
    },
    include: [
      {
        model: db.UserProfile,
        as: 'user',
        attributes: ['id', 'name', 'avatar'],
      },
    ],
  });
  const groupEditors = await db.VesselGroupEditor.findAll({
    where: {
      vesselId: {
        [db.Op.in]: idList,
      },
    },
    include: [
      {
        model: db.Group,
        as: 'group',
        attributes: ['id', 'groupName', 'groupImage'],
      },
    ],
  });
  const vesselEditors = {};
  individualEditors.forEach((row) => {
    const { vesselId, user } = row;
    if (!vesselEditors[vesselId]) {
      vesselEditors[vesselId] = {
        editors: [],
        groupEditors: [],
      };
    }
    vesselEditors[vesselId].editors.push(user);
  });

  groupEditors.forEach((row) => {
    const { vesselId, group } = row;
    if (!vesselEditors[vesselId]) {
      vesselEditors[vesselId] = {
        editors: [],
        groupEditors: [],
      };
    }
    vesselEditors[vesselId].groupEditors.push(group);
  });
  return vesselEditors;
};

exports.getUserDefaultVessel = async (userId) => {
  const defaultVesselId = await db.Vessel.findOne({
    where: {
      createdById: userId,
      isDefaultVessel: true,
    },
    include,
  });

  return defaultVesselId?.toJSON();
};

exports.setAsDefaultVessel = async (vesselId, userId, transaction) => {
  if (!vesselId || !userId) return null;
  await db.Vessel.update(
    {
      isDefaultVessel: false,
    },
    {
      where: {
        createdById: userId,
        isDefaultVessel: true,
      },
      transaction,
    },
  );

  const [result] = await db.Vessel.update(
    {
      isDefaultVessel: true,
    },
    {
      where: {
        id: vesselId,
      },
      transaction,
    },
  );

  return result;
};

exports.getVesselParticipants = async (id) => {
  const vps = await db.VesselParticipant.findAll({
    where: {
      vesselId: {
        [db.Op.in]: Array.isArray(id) ? id : [id],
      },
    },
    order: [['vesselId', 'asc']],
    include: [
      {
        model: db.VesselParticipantGroup,
        as: 'group',
      },
    ],
  });

  return vps.map((t) => t?.toJSON());
};
