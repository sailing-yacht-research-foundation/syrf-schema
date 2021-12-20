const uuid = require('uuid');
const competitionUnitDAL = require('./competitionUnit');
const vesselParticipantDAL = require('./vesselParticipant');
const vesselParticipantGroupDAL = require('./vesselParticipantGroup');
const participantDAL = require('./participant');
const courseDAL = require('./course');

const db = require('../../index');
const { conversionValues, groupMemberStatus } = require('../../enums');
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
    include: [
      {
        model: db.GroupMember,
        as: 'groupMember',
        attributes: ['id', 'userId'],
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
    attributes: ['id', 'name'],
  },
  ...includeMeta,
];

exports.upsert = async (id, data = {}, transaction) => {
  if (!id) id = uuid.v4();

  const [result] = await db.CalendarEvent.upsert(
    {
      ...data,
      id,
    },
    { transaction },
  );

  await result.setEditors((data.editors || []).map((t) => t.id));

  return result?.toJSON();
};

exports.update = async (id, data, transaction) => {
  const [updateCount] = await db.CalendarEvent.update(data, {
    where: {
      id,
    },
    transaction,
  });

  return updateCount;
};

/**
 *
 * @param {import('../../types/pagination').PaginationRequest} paging
 * @param {import('../../types/dataAccess').EventGetAllParams} params
 * @returns
 */
exports.getAll = async (paging, params = {}) => {
  let where = {};
  let order = [];
  let replacements = {};
  let attributes;
  if (paging.query) {
    where[db.Op.or] = [
      {
        name: {
          [db.Op.iLike]: `%${paging.query}%`,
        },
      },
      {
        locationName: {
          [db.Op.iLike]: `%${paging.query}%`,
        },
      },
    ];
  }

  if (params.position) {
    // Query by locations
    const [lon, lat] = params.position;
    replacements = { lon: parseFloat(lon), lat: parseFloat(lat) };
    const distanceInMeters =
      params.radius * conversionValues.nauticalMilesToMeters;
    const sourceLocation = db.Sequelize.literal(`ST_MakePoint(:lon, :lat)`);

    attributes = {
      include: [
        [
          db.Sequelize.fn(
            'ST_DistanceSphere',
            db.Sequelize.literal('"location"'),
            sourceLocation,
          ),
          'distance',
        ],
      ],
    };
    where = {
      ...where,
      [db.Op.and]: [
        db.Sequelize.where(
          db.Sequelize.fn(
            'ST_DistanceSphere',
            db.Sequelize.literal('"location"'),
            sourceLocation,
          ),
          {
            [db.Op.lte]: distanceInMeters,
          },
        ),
      ],
    };
    // Needed, this will trigger the index scan (Nearest Neighbouring Searching)
    // https://postgis.net/workshops/postgis-intro/knn.html
    order = [
      [
        db.Sequelize.literal(
          `"location" <-> 'SRID=4326;POINT(:lon :lat)'::geometry`,
        ),
      ],
    ];
  } else {
    // only allow list events without createdBy id if listing by position
    if (params.userId) where.createdById = params.userId;
    else return emptyPagingResponse(paging);
  }

  if (typeof params?.private === 'boolean') {
    where.isPrivate = params?.private;
  }
  if (typeof params?.isOpen === 'boolean') {
    where.isOpen = params?.isOpen;
  }

  const result = await db.CalendarEvent.findAllWithPaging(
    {
      attributes,
      where,
      replacements,
      order,
    },
    paging,
  );
  const { rows } = result;

  // Formatting output from DataAccess to return virtually the same data structure as before (location -> lon, lat)
  const formattedRows = [];
  rows.forEach((row) => {
    const plainData = row.get({ plain: true });
    const { location, ...otherData } = plainData;
    formattedRows.push({
      ...otherData,
      lon: location?.coordinates?.[0],
      lat: location?.coordinates?.[1],
    });
  });

  return {
    ...result,
    rows: formattedRows,
  };
};

exports.getById = async (id, transaction) => {
  if (!id) return null;
  const result = await db.CalendarEvent.findByPk(id, {
    include,
    transaction,
  });

  let data = result?.toJSON();
  if (data) {
    const { location, editors, groupEditors, ...otherData } = data;
    let editorsFromGroup = [];
    groupEditors.forEach((group) => {
      editorsFromGroup = [
        ...editorsFromGroup,
        ...group.groupMember.map((row) => {
          return {
            id: row.userId,
            name: row.member.name,
          };
        }),
      ];
    });
    data = {
      ...otherData,
      lon: location?.coordinates?.[0],
      lat: location?.coordinates?.[1],
      editors: [...editors, ...editorsFromGroup],
    };
  }
  return data;
};

exports.getCompetitionUnitsById = async (id, params = {}, transaction) => {
  if (!id) return null;
  const result = await db.CompetitionUnit.findAll({
    where: {
      calendarEventId: id,
    },
    raw: true,
    transaction,
    attributes: [...(params.attributes || []), 'id', 'name', 'startTime'],
  });

  return result;
};

exports.getParticipantsById = async (id, transaction) => {
  if (!id) return null;
  const result = await db.Participant.findAll({
    where: {
      calendarEventId: id,
    },
    raw: true,
    attributes: ['id', 'publicName'],
    transaction,
  });

  return result;
};

/**
 * Get events admins/editors and owners
 * @param {string} id CalendarEvent Id
 * @param {import('../../types/dataAccess').EventGetAdminsByIdParams} params  optional parameters when querying the admins
 * @returns
 */
exports.getAdminsById = async (id, params = {}) => {
  if (!id) return null;
  const result = await db.CalendarEvent.findByPk(id, {
    include,
    attributes: [
      ...(params.includeAttributes || []),
      'id',
      'name',
      'isOpen',
      'ownerId',
      'status',
    ],
    transaction: params.transaction,
  });

  let data = result?.toJSON();
  if (data) {
    // Combining editors from groupEditors with regular editors
    const { editors, groupEditors, ...otherData } = data;
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
      ...otherData,
      editors: [...editors, ...editorsFromGroup],
    };
  }
  return data;
};

/**
 * Validate events admins/editors and owners
 * @param {string} id CalendarEvent Id
 * @param {string} userId User Id
 * @param {import('../../types/dataAccess').EventGetAdminsByIdParams} params  optional parameters when querying the admins
 * @returns {import('../../types/dataAccess').EventValidateAdminsByIdReturn}
 */
exports.validateAdminsById = async (id, userId, params = {}) => {
  if (!id) return null;
  const event = await exports.getAdminsById(id, params);

  let result = {
    isOwner: false,
    isEditor: false,
    event,
  };

  if (!event) return result;

  if (!userId) return result;

  if (Array.isArray(event.editors) && event.editors.length > 0) {
    const idIndex = event.editors.findIndex((t) => t.id === userId);
    result.isEditor = idIndex > -1;
  }

  result.isOwner = event.ownerId === userId || event.owner.id === userId;

  return result;
};

exports.delete = async (id, transaction) => {
  const data = await db.CalendarEvent.findByPk(id, {
    include,
    transaction,
  });

  if (!data) return data;

  let param = {
    where: {
      calendarEventId: id,
    },
    attributes: ['id'],
    raw: true,
    transaction,
  };
  const [races, vpgs, participants, courses] = await Promise.all([
    db.CompetitionUnit.findAll(param),
    db.VesselParticipantGroup.findAll(param),
    db.Participant.findAll(param),
    db.Course.findAll(param),
  ]);

  const vps = await db.VesselParticipant.findAll({
    where: {
      vesselParticipantGroupId: {
        [db.Op.in]: vpgs.map((t) => t.id),
      },
    },
    attributes: ['id'],
    raw: true,
    transaction,
  });

  await Promise.all([
    competitionUnitDAL.delete(
      races.map((t) => t.id),
      transaction,
    ),
    vesselParticipantGroupDAL.delete(
      vpgs.map((t) => t.id),
      transaction,
    ),
    vesselParticipantDAL.delete(
      vps.map((t) => t.id),
      transaction,
    ),
    participantDAL.delete(
      participants.map((t) => t.id),
      transaction,
    ),
    courseDAL.delete(
      courses.map((t) => t.id),
      transaction,
    ),
    db.CalendarEditor.destroy({
      where: {
        CalendarEventId: id,
      },
      transaction,
    }),
    db.CalendarGroupEditor.destroy({
      where: {
        calendarEventId: id,
      },
      transaction,
    }),
    db.TrackHistory.destroy({
      where: {
        calendarEventId: id,
      },
      transaction,
    }),
    db.CalendarEvent.destroy(
      {
        where: {
          id: id,
        },
      },
      transaction,
    ),
    db.Vessel.destroy(
      {
        where: {
          scope: id,
        },
      },
      transaction,
    ),
  ]);

  return data?.toJSON();
};

exports.getMyEvents = async (id, pagination) => {
  const result = await db.CalendarEvent.findAllWithPaging({}, pagination);

  return result?.toJSON();
};

exports.addOpenGraph = async (id, openGraphImage) => {
  await db.CalendarEvent.update(
    { openGraphImage },
    {
      where: {
        id,
      },
    },
  );
};

exports.addUsersAsEditor = async (id, users, transaction) => {
  const data = users.map((userId) => {
    return { UserProfileId: userId, CalendarEventId: id };
  });
  const result = await db.CalendarEditor.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.removeUsersFromEditor = async (id, users, transaction) => {
  const deleteCount = await db.CalendarEditor.destroy({
    where: {
      CalendarEventId: id,
      UserProfileId: {
        [db.Op.in]: users,
      },
    },
    transaction,
  });
  return deleteCount;
};

exports.getEventEditors = async (id) => {
  const individualEditors = await db.CalendarEditor.findAll({
    where: {
      CalendarEventId: id,
    },
    include: [
      {
        model: db.UserProfile,
        as: 'user',
        attributes: ['id', 'name', 'avatar'],
      },
    ],
  });
  const groupEditors = await db.CalendarGroupEditor.findAll({
    where: {
      calendarEventId: id,
    },
    include: [
      {
        model: db.Group,
        as: 'group',
        attributes: ['id', 'groupName', 'groupImage'],
      },
    ],
  });
  return {
    individualEditors,
    groupEditors,
  };
};

exports.getUserEvents = async (paging, userId) => {
  let where = {
    [db.Op.and]: [
      {
        [db.Op.or]: [
          { ownerId: userId },
          db.sequelize.where(db.sequelize.literal(`"editors"."id"`), {
            [db.Op.ne]: null,
          }),
          db.sequelize.where(
            db.sequelize.literal(`"groupEditors->groupMember"."userId"`),
            {
              [db.Op.ne]: null,
            },
          ),
          db.sequelize.where(db.sequelize.literal(`"participants"."id"`), {
            [db.Op.ne]: null,
          }),
        ],
      },
    ],
  };
  let order = [];
  if (paging.query) {
    where[db.Op.or] = [
      {
        name: {
          [db.Op.iLike]: `%${paging.query}%`,
        },
      },
      {
        locationName: {
          [db.Op.iLike]: `%${paging.query}%`,
        },
      },
    ];
  }

  const result = await db.CalendarEvent.findAllWithPaging(
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
        // Participating in events
        {
          model: db.Participant,
          as: 'participants',
          attributes: ['id', 'userProfileId'],
          where: {
            userProfileId: userId,
          },
          required: false,
        },
      ],
      replacements: {
        userId,
      },
      where,
      order,
      // Note: This line here is the key for this query to work without having to use aggregate subquery in attributes. For future reference so we don't waste time looking for ways to query with paging
      // Reference: https://stackoverflow.com/questions/43729254/sequelize-limit-and-offset-incorrect-placement-in-query
      subQuery: false,
    },
    paging,
  );
  const { count, rows, page, size } = result;

  const formattedRows = [];
  rows.forEach((row) => {
    const plainData = row.get({ plain: true });
    const { location, ...otherData } = plainData;
    formattedRows.push({
      ...otherData,
      lon: location?.coordinates?.[0],
      lat: location?.coordinates?.[1],
    });
  });

  return {
    count,
    rows: formattedRows,
    page,
    size,
  };
};

exports.getByScrapedOriginalIdAndSource = async (originalIds, source) => {
  const where = {
    source,
  };
  if (originalIds instanceof Array) {
    where.scrapedOriginalId = {
      [db.Op.in]: originalIds,
    };
  } else {
    where.scrapedOriginalId = originalIds;
  }
  return await db.CalendarEvent.findAll({
    attributes: ['id', 'scrapedOriginalId'],
    where,
  });
};
