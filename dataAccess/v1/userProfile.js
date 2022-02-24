const { userSignupType } = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');
exports.upsert = async (userProfile = {}, transaction) => {
  const [result] = await db.UserProfile.upsert(
    {
      ...userProfile,
    },
    { transaction },
  );

  return result.toJSON();
};

exports.updateProfile = async (userId, userProfile = {}, transaction) => {
  const result = await db.UserProfile.update(userProfile, {
    where: {
      id: userId,
    },
    transaction,
  });

  return result;
};

exports.acceptEula = async (data, userId) => {
  const [updateCount] = await db.UserProfile.update(data, {
    where: {
      id: userId,
      signupType: userSignupType.REGISTERED,
    },
  });

  return updateCount;
};

exports.getById = async (sub) => {
  return await db.UserProfile.findByPk(sub, {
    raw: true,
  });
};

exports.getBySub = async (sub) => {
  return await db.UserProfile.findOne(
    { where: { sub } },
    {
      raw: true,
    },
  );
};

exports.getAllByEmail = async (emails) => {
  return await db.UserProfile.findAll({
    where: {
      email: {
        [Op.in]: emails,
      },
    },
    raw: true,
  });
};

exports.getAllById = async (ids) => {
  return await db.UserProfile.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    raw: true,
  });
};

exports.delete = async (sub, transaction) => {
  const data = await db.UserProfile.findByPk(sub);

  if (data) {
    await db.UserProfile.destroy({
      attributes: ['id', 'email', 'name'],
      where: {
        id: sub,
      },
      transaction,
    });
  }

  return data?.toJSON();
};

exports.clear = async () => {
  await db.UserProfile.destroy({
    truncate: true,
    cascade: true,
    force: true,
  });
};

exports.getByStripeSubscription = async (
  stripeSubscriptionId,
  stripeCustomerId,
) => {
  return await db.UserProfile.findOne({
    where: {
      stripeCustomerId,
      stripeSubscriptionId,
    },
    raw: true,
  });
};

exports.getByStripeCustomer = async (stripeCustomerId) => {
  return await db.UserProfile.findOne({
    where: {
      stripeCustomerId,
    },
    raw: true,
  });
};

exports.getPushSubscriptions = async (ids) => {
  const data = await db.UserProfile.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    attributes: [
      'id',
      'email',
      'locale',
      'optInEmailNotification',
      'optInMobileNotification',
      'webpushSubscription',
      'mobilePushSubscription',
    ],
  });
  return data;
};
