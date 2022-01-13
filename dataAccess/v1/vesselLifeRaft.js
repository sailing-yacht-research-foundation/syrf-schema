const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.VesselLifeRaft.create(data, {
    validate: true,
    transaction,
  });
};

exports.update = async (id, data, transaction) => {
  const [updateCount, updatedData] = await db.VesselLifeRaft.update(data, {
    where: {
      id,
    },
    returning: true,
    transaction,
  });

  return { updateCount, updatedData };
};

exports.getAllByVessel = async (vesselId) => {
  const result = await db.VesselLifeRaft.findAll({
    where: {
      vesselId,
    },
    attributes: [
      'id',
      'serialNumber',
      'capacity',
      'manufacturer',
      'model',
      'container',
      'lastServiceDate',
      'manufactureDate',
      'ownership',
      'verifyDate',
      'verifierUserId',
    ],
  });

  return result;
};

exports.getById = async (id) => {
  const result = await db.VesselLifeRaft.findByPk(id);
  let data = result?.toJSON();
  return data;
};

exports.delete = async (id, transaction) => {
  return await db.VesselLifeRaft.destroy({
    where: {
      id: id,
    },
    transaction,
  });
};
