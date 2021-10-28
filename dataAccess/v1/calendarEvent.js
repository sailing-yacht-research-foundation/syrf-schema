const uuid = require('uuid');
const competitionUnitDAL = require('./competitionUnit');
const vesselParticipantDAL = require('./vesselParticipant');
const vesselParticipantGroupDAL = require('./vesselParticipantGroup');
const participantDAL = require('./participant');
const courseDAL = require('./course');

const db = require('../../index');
const { conversionValues } = require('../../enums');
const { includeMeta } = require('../../utils/utils');

const include = [
  {
    model: db.UserProfile,
    as: 'editors',
    attributes: ['id', 'name'],
    through: {
      attributes: [],
    },
  },
  {
    model: db.Group,
    as: 'groupEditors',
    attributes: ['id', 'groupName'],
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

  const [result] = await db.CalenderEvent.upsert(
    {
      ...data,
      id,
    },
    { transaction },
  );

  await result.setEditors((data.editors || []).map((t) => t.id));

  return result?.toJSON();
};

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
      isOpen: true,
      // isCompleted: false, // TODO: Use end date for this
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
  }

  if (typeof params?.private === 'boolean') {
    where.isPrivate = params?.private;
  }

  const result = await db.CalenderEvent.findAllWithPaging(
    {
      attributes,
      where,
      replacements,
      order,
    },
    paging,
  );
  const { count, rows, page, size } = result;

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
    count,
    rows: formattedRows,
    page,
    size,
  };
};

exports.getById = async (id, transaction) => {
  if (!id) return null;
  const result = await db.CalenderEvent.findByPk(id, {
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

exports.getCompetitionUnitsById = async (id, transaction) => {
  if (!id) return null;
  const result = await db.CompetitionUnit.findAll({
    where: {
      calendarEventId: id,
    },
    raw: true,
    transaction,
    attributes: ['id', 'name'],
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

exports.getAdminsById = async (id) => {
  if (!id) return null;
  const result = await db.CalenderEvent.findByPk(id, {
    include,
    attributes: ['id', 'name'],
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
            name: row.member.name,
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

exports.delete = async (id, transaction) => {
  const data = await db.CalenderEvent.findByPk(id, {
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

  await competitionUnitDAL.delete(
    races.map((t) => t.id),
    transaction,
  );
  await Promise.all([
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
    db.CalenderEvent.destroy(
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
  const result = await db.CalenderEvent.findAllWithPaging({}, pagination);

  return result?.toJSON();
};

exports.addOpenGraph = async (id, openGraphImage) => {
  await db.CalenderEvent.update(
    { openGraphImage },
    {
      where: {
        id,
      },
    },
  );
};
