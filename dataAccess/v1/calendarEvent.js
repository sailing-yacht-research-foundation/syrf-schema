const uuid = require('uuid');
const competitionUnitDAL = require('./competitionUnit');
const vesselParticipantDAL = require('./vesselParticipant');
const vesselParticipantGroupDAL = require('./vesselParticipantGroup');
const participantDAL = require('./participant');
const courseDAL = require('./course');

const db = require('../../index');
const {
  conversionValues,
  groupMemberStatus,
  participantInvitationStatus,
  calendarEventStatus,
  dataSources,
} = require('../../enums');
const {
  includeMeta,
  emptyPagingResponse,
  removeDomainFromUrl,
} = require('../../utils/utils');
const { Op } = require('../../index');

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
            attributes: ['id', 'name', 'avatar'],
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
            avatar: row.member.avatar,
            fromGroup: true,
            groupId: row.groupId,
          };
        }),
      ];
    });
    data = {
      ...otherData,
      location,
      lon: location?.coordinates?.[0],
      lat: location?.coordinates?.[1],
      editors: [...editors, ...editorsFromGroup],
      groups: groupEditors.map((group) => ({
        id: group.id,
        groupName: group.groupName,
        groupImage: group.groupImage,
      })),
    };
  }
  return data;
};
exports.getByIds = async (ids = [], attributes) => {
  if (ids.length === 0) {
    return [];
  }
  const result = await db.CalendarEvent.findAll({
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
    attributes: [
      'id',
      'publicName',
      'invitationStatus',
      'allowShareInformation',
      'vesselId',
      'sailNumber',
      'trackerDistanceToBow',
      'userProfileId',
    ],
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
      { shouldDeleteTrackJson: true },
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
    db.CalendarEvent.destroy({
      where: {
        id: id,
      },
      transaction,
    }),
    db.Vessel.destroy({
      where: {
        scope: id,
      },
      force: true,
      transaction,
    }),
  ]);

  return data?.toJSON();
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

exports.getUserEvents = async (paging, userId, { location } = {}) => {
  let includeDistance = null;
  let defaultSort = undefined;

  const sourceLocation = db.Sequelize.literal(`ST_MakePoint(:lon, :lat)`);

  if (location) {
    includeDistance = [
      db.Sequelize.fn(
        'ST_DistanceSphere',
        db.Sequelize.literal('"location"'),
        sourceLocation,
      ),
      'distance',
    ];
    defaultSort = [
      db.Sequelize.literal(
        `CASE WHEN "CalendarEvent"."status" in ('${calendarEventStatus.ONGOING}','${calendarEventStatus.SCHEDULED}') THEN 0 ELSE 1 END ASC`,
      ),
      [
        db.Sequelize.literal(
          `"location" <-> 'SRID=4326;POINT(:lon :lat)'::geometry`,
        ),
        'ASC',
      ],
    ];
  }

  let where = {
    [db.Op.and]: [
      {
        [db.Op.or]: [
          { ownerId: userId },
          db.Sequelize.where(db.Sequelize.literal(`"editors"."id"`), {
            [db.Op.ne]: null,
          }),
          db.Sequelize.where(
            db.Sequelize.literal(`"groupEditors->groupMember"."userId"`),
            {
              [db.Op.ne]: null,
            },
          ),
          db.Sequelize.where(db.Sequelize.literal(`"participants"."id"`), {
            [db.Op.ne]: null,
          }),
        ],
      },
    ],
  };

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
      attributes: { include: [includeDistance].filter((t) => !!t) },
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
            invitationStatus: {
              [db.Op.in]: [
                participantInvitationStatus.ACCEPTED,
                participantInvitationStatus.SELF_REGISTERED,
              ],
            },
          },
          required: false,
        },
      ],
      replacements: {
        userId,
        ...(location || {}),
      },
      where,

      // Note: This line here is the key for this query to work without having to use aggregate subquery in attributes. For future reference so we don't waste time looking for ways to query with paging
      // Reference: https://stackoverflow.com/questions/43729254/sequelize-limit-and-offset-incorrect-placement-in-query
      subQuery: false,
    },
    { ...paging, defaultSort },
  );
  const { rows } = result;

  const formattedRows = [];
  rows.forEach((row) => {
    const plainData = row.toJSON();
    const { location, ...otherData } = plainData;
    formattedRows.push({
      ...otherData,
      lon: location?.coordinates?.[0],
      lat: location?.coordinates?.[1],
      isEditor: row.editors?.length > 0 || row.groupEditors?.length > 0,
      isParticipant: row.participants?.length > 0,
    });
  });

  return {
    ...result,
    rows: formattedRows,
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
    attributes: [
      'id',
      'scrapedOriginalId',
      'name',
      'approximateStartTime',
      'approximateEndTime',
    ],
    where,
  });
};

exports.clearGroupAdmins = async (id, transaction) => {
  const result = await db.CalendarGroupEditor.destroy(
    {
      where: {
        calendarEventId: id,
      },
    },
    { transaction },
  );

  return result;
};

exports.getBulkEventEditors = async (idList) => {
  const individualEditors = await db.CalendarEditor.findAll({
    where: {
      CalendarEventId: {
        [Op.in]: idList,
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
  const groupEditors = await db.CalendarGroupEditor.findAll({
    where: {
      calendarEventId: {
        [Op.in]: idList,
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
  const calendarEventEditors = {};
  individualEditors.forEach((row) => {
    const { CalendarEventId: eventId, user } = row;
    if (!calendarEventEditors[eventId]) {
      calendarEventEditors[eventId] = {
        editors: [],
        groupEditors: [],
      };
    }
    calendarEventEditors[eventId].editors.push(user);
  });

  groupEditors.forEach((row) => {
    const { calendarEventId, group } = row;
    if (!calendarEventEditors[calendarEventId]) {
      calendarEventEditors[calendarEventId] = {
        editors: [],
        groupEditors: [],
      };
    }
    calendarEventEditors[calendarEventId].groupEditors.push(group);
  });
  return calendarEventEditors;
};

exports.getEventForScheduler = async (statusArray, filterDateStart) => {
  let where = {
    status: {
      [Op.in]: statusArray,
    },
    approximateEndTime_utc: {
      [Op.lte]: filterDateStart,
    },
  };
  let order = [['approximateEndTime_utc', 'ASC']];

  const result = await db.CalendarEvent.findAll({
    attributes: [
      'id',
      'name',
      'status',
      'approximateEndTime_utc',
      'isSimulation',
      'ownerId',
      'scrapedOriginalId',
    ],
    include: [
      {
        model: db.CompetitionUnit,
        as: 'competitionUnit',
        attributes: ['id', 'name', 'status'],
      },
    ],
    where,
    order,
  });

  return result.map((row) => {
    const {
      id: calendarEventId,
      name: calendarEventName,
      status,
      approximateEndTime_utc,
      competitionUnit,
      isSimulation,
      ownerId,
    } = row;
    return {
      calendarEventId,
      calendarEventName,
      status,
      approximateEndTime_utc,
      isSimulation,
      ownerId,
      competitionUnits: competitionUnit.map((cUnit) => {
        const { id: competitionUnitId, status, name } = cUnit;
        return { competitionUnitId, status, name };
      }),
    };
  });
};

exports.bulkUpdate = async (idList, data, transaction) => {
  const [updateCount] = await db.CalendarEvent.update(data, {
    where: {
      id: {
        [Op.in]: idList,
      },
    },
    transaction,
  });

  return updateCount;
};

/**
 *
 * @param {string} id
 * @param {import('sequelize').Transaction} transaction
 * @returns {import('../../types/dataAccess').RelatedFile[]}
 */
exports.getRelatedFiles = async (id, transaction) => {
  const [competitionUnits, eventDetail] = await Promise.all([
    exports.getCompetitionUnitsById(id, {}, transaction),
    exports.getById(id, transaction),
  ]);

  const result = [];

  if (!eventDetail) return result;

  if (eventDetail.openGraphImage)
    result.push({
      type: 'og_image',
      path: removeDomainFromUrl(eventDetail.openGraphImage),
      bucket: 'opengraph_image',
    });

  if (eventDetail.noticeOfRacePDF)
    result.push({
      type: 'notice_of_race',
      path: removeDomainFromUrl(eventDetail.noticeOfRacePDF),
      bucket: 'avatar_bucket',
    });

  if (eventDetail.mediaWaiverPDF)
    result.push({
      type: 'media_waiver',
      path: removeDomainFromUrl(eventDetail.mediaWaiverPDF),
      bucket: 'avatar_bucket',
    });

  if (eventDetail.disclaimerPDF)
    result.push({
      type: 'event_disclaimer',
      path: removeDomainFromUrl(eventDetail.disclaimerPDF),
      bucket: 'avatar_bucket',
    });

  const competitionUnitFiles = (
    await Promise.all(
      competitionUnits.map(async (cu) =>
        (
          await competitionUnitDAL.getRelatedFiles(cu.id, transaction)
        ).map((t) => ({ ...t, competitionUnitId: cu.id })),
      ),
    )
  ).flat(1);

  result.push(...competitionUnitFiles);

  return result;
};

exports.getUntrackedEvents = async (filterTimeStart, filterTimeEnd) => {
  const result = await db.CalendarEvent.findAll({
    where: {
      approximateStartTime_utc: {
        [db.Op.gte]: filterTimeStart,
        [db.Op.lt]: filterTimeEnd,
      },
      status: {
        [db.Op.in]: [
          calendarEventStatus.SCHEDULED,
          calendarEventStatus.ONGOING,
          calendarEventStatus.COMPLETED,
        ],
      },
      source: dataSources.SYRF,
      '$tracks.id$': null,
      isSimulation: false,
    },
    subQuery: false,
    include: [
      {
        model: db.TrackHistory,
        as: 'tracks',
        required: false,
        attributes: ['id'],
      },
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
            include: [
              {
                as: 'member',
                model: db.UserProfile,
                attributes: ['id', 'name', 'avatar'],
              },
            ],
            where: {
              status: groupMemberStatus.accepted,
            },
          },
        ],
      },
    ],
    attributes: ['id', 'name', 'approximateStartTime_utc', 'status', 'ownerId'],
  });

  let data = result.map((t) => t.toJSON());
  if (data.length > 0) {
    data = data.map((record) => {
      const { editors, groupEditors, ownerId, ...otherData } = record;
      let editorsFromGroup = [];
      groupEditors.forEach((group) => {
        editorsFromGroup = [
          ...editorsFromGroup,
          ...group.groupMember.map((row) => {
            return row.userId;
          }),
        ];
      });
      return {
        ...otherData,
        editors: Array.from(
          new Set([
            ownerId,
            ...editors.map((row) => row.id),
            ...editorsFromGroup,
          ]),
        ).filter((row) => row != null),
      };
    });
  }
  return data;
};
