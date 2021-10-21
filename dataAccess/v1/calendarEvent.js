const uuid = require('uuid');
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
  const result = await db.CalenderEvent.findByPk(id, {
    include,
    transaction,
  });

  let data = result?.toJSON();
  if (data) {
    const { location, ...otherData } = data;
    data = {
      ...otherData,
      lon: location?.coordinates?.[0],
      lat: location?.coordinates?.[1],
    };
  }
  return data;
};

exports.delete = async (id, transaction) => {
  const data = await db.CalenderEvent.findByPk(id, {
    include,
  });

  if (data) {
    await db.CalenderEvent.destroy(
      {
        where: {
          id: id,
        },
      },
      { transaction },
    );
  }

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
