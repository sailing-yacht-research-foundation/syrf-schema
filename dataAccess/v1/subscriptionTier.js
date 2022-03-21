const db = require('../../index');

exports.getAll = async () => {
  const result = await db.SubscriptionTier.findAll({ raw: true });
  return result;
};

exports.getByCode = async (tierCode) => {
  const result = await db.SubscriptionTier.findOne({
    where: { tierCode },
    raw: true,
  });
  return result;
};

exports.getByStripeId = async (stripeProductId) => {
  const result = await db.SubscriptionTier.findOne({
    where: { stripeProductId },
    raw: true,
  });
  return result;
};
