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
exports.create = async ({ id, name, email }, transaction) => {
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
      transaction,
    },
  );
};

exports.delete = async (id, transaction) => {
  const relatedUser = (
    await db.UserProfile.findOne({
      where: {
        developerAccountId: id,
      },
      transaction,
    })
  )?.toJSON();

  return (
    await Promise.all([
      db.Developer.destroy({
        where: {
          id,
        },
        transaction,
      }),
      relatedUser?.id
        ? db.UserProfile.update(
            {
              developerAccountId: null,
            },
            {
              where: {
                id: relatedUser.id,
              },
              transaction,
            },
          )
        : Promise.resolve(),
    ])
  )[0];
};
