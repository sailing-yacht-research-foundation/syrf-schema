const db = require('../../index');

exports.getNotifications = async (userId, pagination) => {
  const result = await db.UserNotification.findAllWithPaging(
    {
      attributes: [
        'id',
        'userId',
        'notificationType',
        'notificationTitle',
        'notificationMessage',
        'metadata',
        'createdAt',
        'readAt',
      ],
      where: {
        userId,
      },
    },
    { ...pagination, sort: 'createdAt' },
  );

  return result;
};

exports.getById = async (id, userId) => {
  const result = await db.UserNotification.findByPk(id, {
    where: {
      id,
      userId,
    },
  });

  return result?.toJSON();
};

exports.addNewNotification = async (data, transaction) => {
  return await db.UserNotification.create(data, {
    transaction,
  });
};
