const uuid = require('uuid');
const db = require('../../index');

exports.getById = async (id, transaction) => {
  return db.Developer.findByPk(id, { raw: true, transaction });
};

/**
 *
 * @param {*} userProfile
 * @param {*} transaction
 * @returns
 */
exports.create = async ({ id, name, email } = {}, transaction) => {
  const developer = await db.Developer.create(
    {
      id: uuid.v4(),
      name,
      email,
    },
    {
      transaction,
    },
  );

  return await db.UserProfile.update(
    {
      developerAccountId: developer.toJSON().id,
    },
    {
      where: {
        id,
      },
    },
  );
};
