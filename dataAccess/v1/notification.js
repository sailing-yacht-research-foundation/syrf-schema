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
    { ...pagination, defaultSort: [['createdAt', 'DESC']] },
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
  const createdAt = Date.now();
  const result = await db.UserNotification.bulkCreate(
    data.map((row) => {
      const {
        userId,
        notificationType,
        notificationTitle,
        notificationMessage,
        metadata,
      } = row;
      return {
        userId,
        notificationType,
        notificationTitle,
        notificationMessage,
        metadata,
        createdAt,
      };
    }),
    {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    },
  );
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

exports.markAllUnreadAsRead = async (userId, transaction) => {
  const [updateCount] = await db.UserNotification.update(
    {
      readAt: Date.now(),
    },
    {
      where: {
        readAt: {
          [db.Op.eq]: null,
        },
        userId,
      },
      transaction,
    },
  );
  return updateCount;
};

exports.getUnreadCount = async (userId) => {
  const unreadCount = await db.UserNotification.count({
    where: {
      userId,
      readAt: {
        [db.Op.eq]: null,
      },
    },
  });

  return unreadCount;
};
