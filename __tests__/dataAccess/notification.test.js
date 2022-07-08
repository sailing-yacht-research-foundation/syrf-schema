const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  getNotifications,
  getById,
  addNewNotification,
  markAsRead,
  markAllUnreadAsRead,
  getUnreadCount,
} = require('../../dataAccess/v1/notification');
const { notificationTypes } = require('../../enums');

const db = require('../../index');

describe('Notification DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getNotifications', () => {
    it('should findAllWithpaging with defaultSort', async () => {
      const userId = uuid.v4();
      const paging = { page: 1, size: 10 };

      await getNotifications(userId, paging);

      expect(db.UserNotification.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: expect.arrayContaining([
            'id',
            'userId',
            'notificationType',
            'notificationTitle',
            'notificationMessage',
            'metadata',
            'createdAt',
            'readAt',
          ]),
          where: {
            userId,
          },
        },
        { ...paging, defaultSort: [['createdAt', 'DESC']] },
      );
    });
  });

  describe('getById', () => {
    it('should findAllWithpaging with defaultSort', async () => {
      const id = uuid.v4();
      const userId = uuid.v4();
      const mockUserNotification = {
        id,
        userId,
        notificationType: notificationTypes.kudosReceived,
        notificationTitle: faker.random.words(3),
        notificationMessage: faker.random.words(10),
        metadata: {},
        createdAt: new Date(),
        readAt: null,
      };
      db.UserNotification.findByPk.mockResolvedValueOnce({
        toJSON: () => mockUserNotification,
      });

      const result = await getById(id, userId);

      expect(result).toEqual(mockUserNotification);
      expect(db.UserNotification.findByPk).toHaveBeenCalledWith(id, {
        where: {
          id,
          userId,
        },
      });
    });
  });

  describe('addNewNotification', () => {
    it('should bulkCreate UserNotification', async () => {
      const userId = uuid.v4();
      const mockUserNotifications = [
        {
          userId,
          notificationType: notificationTypes.kudosReceived,
          notificationTitle: faker.random.words(3),
          notificationMessage: faker.random.words(10),
          metadata: {},
        },
      ];
      db.UserNotification.bulkCreate.mockResolvedValueOnce(
        mockUserNotifications,
      );

      const result = await addNewNotification(
        mockUserNotifications,
        mockTransaction,
      );

      expect(result).toEqual(mockUserNotifications);
      expect(db.UserNotification.bulkCreate).toHaveBeenCalledWith(
        mockUserNotifications.map((row) => {
          return {
            ...row,
            createdAt: expect.any(Number),
          };
        }),
        {
          ignoreDuplicates: true,
          validate: true,
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('markAsRead', () => {
    it('should update UserNotification readAt column with current time', async () => {
      const ids = Array(5)
        .fill()
        .map(() => uuid.v4());
      const userId = uuid.v4();
      db.UserNotification.update.mockResolvedValueOnce([ids.length, undefined]);

      const result = await markAsRead(ids, userId, mockTransaction);

      expect(result).toEqual(ids.length);
      expect(db.UserNotification.update).toHaveBeenCalledWith(
        {
          readAt: expect.any(Number),
        },
        {
          where: {
            id: {
              [db.Op.in]: ids,
            },
            userId,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('markAllUnreadAsRead', () => {
    it('should update UserNotification readAt column with current time for all notification of the user', async () => {
      const userId = uuid.v4();
      db.UserNotification.update.mockResolvedValueOnce([10, undefined]);

      const result = await markAllUnreadAsRead(userId, mockTransaction);

      expect(result).toEqual(10);
      expect(db.UserNotification.update).toHaveBeenCalledWith(
        {
          readAt: expect.any(Number),
        },
        {
          where: {
            readAt: {
              [db.Op.eq]: null,
            },
            userId,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return the number of unread notification of the user', async () => {
      db.UserNotification.count.mockResolvedValueOnce(10);
      const userId = uuid.v4();

      const result = await getUnreadCount(userId);

      expect(result).toEqual(10);
      expect(db.UserNotification.count).toHaveBeenCalledWith({
        where: {
          userId,
          readAt: {
            [db.Op.eq]: null,
          },
        },
      });
    });
  });
});
