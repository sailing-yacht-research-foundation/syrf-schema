const uuid = require('uuid');
const db = require('../../index');
const { includeMeta } = require('../../utils/utils');

const include = [...includeMeta];

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

exports.getAll = async (paging = {}) => {
  let where = {};

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

exports.getById = async (id) => {
  const result = await db.Vessel.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.delete = async (id, transaction) => {
  const data = await db.Vessel.findByPk(id, {
    include,
  });

  if (data) {
    await db.Vessel.destroy({
      where: {
        id: id,
      },
      transaction
    });
  }

  return data?.toJSON();
};

exports.getAllForEvent = async (userId, eventId, paging = {}) => {
  let where = {
    [db.Op.or]: [
      {
        createdById: userId,
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

exports.getVesselByVesselIdAndSource = async (vesselId, source) => {
  return await db.Vessel.findOne({
    where: {
      vesselId,
      source,
    },
  });
}
