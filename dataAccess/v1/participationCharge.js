const db = require('../../index');

exports.getById = async (id) => {
  const result = await db.ParticipationCharge.findByPk(id);
  return result?.toJSON();
};

exports.getBySessionId = async (checkoutSessionId) => {
  const result = await db.ParticipationCharge.findOne({
    where: { checkoutSessionId },
    raw: true,
  });
  return result;
};

exports.getByEventAndUser = async (calendarEventId, userId) => {
  const result = await db.ParticipationCharge.findOne({
    where: { calendarEventId, userId },
    raw: true,
  });
  return result;
};

exports.insert = async (
  { calendarEventId, userId, checkoutSessionId, expireDate },
  transaction,
) => {
  const data = await db.ParticipationCharge.create(
    {
      calendarEventId,
      userId,
      checkoutSessionId,
      expireDate,
    },
    { transaction },
  );
  return data;
};

exports.update = async (
  id,
  { checkoutSessionId, expireDate, paymentDate },
  transaction,
) => {
  const [updateCount] = await db.ParticipationCharge.update(
    Object.assign(
      {},
      checkoutSessionId ? { checkoutSessionId } : {},
      expireDate ? { expireDate } : {},
      paymentDate ? { paymentDate } : {},
    ),
    {
      where: {
        id,
      },
      transaction,
    },
  );
  return updateCount;
};
