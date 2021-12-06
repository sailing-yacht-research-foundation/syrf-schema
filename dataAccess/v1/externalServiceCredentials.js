const db = require('../../index');

exports.getAll = async (paging, userProfileId) => {
  let where = {
    userProfileId,
  };

  const result = await db.ExternalServiceCredential.findAllWithPaging(
    {
      attributes: {
        exclude: ['password'],
      },
      where,
    },
    paging,
  );
  return result;
};

exports.getById = async (id) => {
  const result = await db.ExternalServiceCredential.findByPk(id);

  return result?.toJSON();
};

exports.getByBothUserId = async (userId, userProfileId) => {
  const result = await db.ExternalServiceCredential.findOne({
    where: {
      userId,
      userProfileId,
    },
  });

  return result?.toJSON();
};

exports.insert = async (
  { userId, password, source, userProfileId },
  transaction,
) => {
  let options;
  if (transaction) {
    options = { transaction };
  }
  const result = await db.ExternalServiceCredential.create(
    {
      userId,
      password,
      source,
      userProfileId,
    },
    options,
  );

  return result;
};

exports.update = async (id, data = {}, transaction) => {
  const [updateCount] = await db.ExternalServiceCredential.update(data, {
    where: {
      id,
    },
    transaction,
  });

  return updateCount;
};

exports.delete = async (id, transaction) => {
  const deleteCount = await db.ExternalServiceCredential.destroy({
    where: {
      id,
    },
    transaction,
  });
  return deleteCount;
};
