const db = require('../../index');

exports.getAll = async () => {
  const result = await db.SubscriptionTier.findAll({ raw: true });
  return result;
};
