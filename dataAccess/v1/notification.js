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

exports.addNewNotification = async (
  {
    recipients,
    notificationType,
    notificationMessage,
    notificationTitle,
    metadata,
  },
  transaction,
) => {
  const createdAt = Date.now();
  const data = recipients.map((userId) => {
    return {
      userId,
      notificationType,
      notificationTitle,
      notificationMessage,
      metadata,
      createdAt,
    };
  });
  const result = await db.UserNotification.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return result;
};

exports.markAsRead = async (ids, userId, transaction) => {
  const [updateCount] = await db.UserNotification.update(
    {
      readAt: Date.now(),
    },
    {
      where: {
        id: {
          [db.Op.in]: ids,
        },
        userId,
      },
      transaction,
    },
  );

  return updateCount;
};
