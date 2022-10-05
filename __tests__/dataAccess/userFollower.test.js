const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  getFollowers,
  getFollowing,
  getByValues,
  getBulkIsFollowed,
  insert,
  update,
  upsert,
  delete: deleteFollow,
  deleteUserReference,
  getFollowSummary,
  getTopCountryUser,
  getTopVelocityUser,
  searchFollowedUser,
  getBidirectionalFollowStatus,
} = require('../../dataAccess/v1/userFollower');
const { followerStatus } = require('../../enums');

const db = require('../../index');

describe('User Follower', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getFollowers', () => {
    const userId = uuid.v4();
    const mockFollowers = Array(10)
      .fill()
      .map(() => {
        const followerId = uuid.v4();
        return {
          id: uuid.v4(),
          userId,
          followerId,
          status: followerStatus.accepted,
          follower: {
            id: followerId,
            email: faker.internet.email(),
            avatar: faker.random.numeric(2),
            follower: [],
          },
        };
      });
    beforeAll(() => {
      db.UserFollower.findAllWithPaging.mockResolvedValue(mockFollowers);
    });
    afterAll(() => {
      db.UserFollower.findAllWithPaging.mockReset();
    });

    it('should findAllWithPaging on UserFollower table', async () => {
      const paging = { page: 1, size: 10, query: '' };

      const result = await getFollowers(paging, {
        userId,
        status: followerStatus.accepted,
        reqUserId: userId,
      });

      expect(result).toEqual(mockFollowers);
      expect(db.UserFollower.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'follower',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'email',
                'avatar',
              ]),
              required: true,
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'follower',
                  attributes: expect.arrayContaining(['status']),
                  required: false,
                  where: {
                    followerId: userId,
                  },
                }),
              ]),
            }),
          ]),
          where: {
            userId,
            status: followerStatus.accepted,
          },
          subQuery: false,
        },
        paging,
      );
    });

    it('should findAllWithPaging on UserFollower table with iLike query on follower name', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const result = await getFollowers(paging, {
        userId,
        status: followerStatus.accepted,
        reqUserId: userId,
      });

      expect(result).toEqual(mockFollowers);
      expect(db.UserFollower.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'follower',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'email',
                'avatar',
              ]),
              required: true,
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'follower',
                  attributes: expect.arrayContaining(['status']),
                  required: false,
                  where: {
                    followerId: userId,
                  },
                }),
              ]),
            }),
          ]),
          where: {
            userId,
            status: followerStatus.accepted,
            ['$follower.name$']: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
          subQuery: false,
        },
        paging,
      );
    });
  });

  describe('getFollowing', () => {
    const followerId = uuid.v4();
    const mockFollowing = Array(10)
      .fill()
      .map(() => {
        const userId = uuid.v4();
        return {
          id: uuid.v4(),
          userId,
          followerId,
          status: followerStatus.accepted,
          follower: {
            id: followerId,
            email: faker.internet.email(),
            avatar: faker.random.numeric(2),
            follower: [],
          },
        };
      });
    beforeAll(() => {
      db.UserFollower.findAllWithPaging.mockResolvedValue(mockFollowing);
    });
    afterAll(() => {
      db.UserFollower.findAllWithPaging.mockReset();
    });

    it('should findAllWithPaging on UserFollower table', async () => {
      const paging = { page: 1, size: 10, query: '' };

      const result = await getFollowing(paging, {
        followerId,
        status: followerStatus.accepted,
        reqUserId: followerId,
      });

      expect(result).toEqual(mockFollowing);
      expect(db.UserFollower.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'following',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'email',
                'avatar',
              ]),
              required: true,
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'follower',
                  attributes: expect.arrayContaining(['status']),
                  required: false,
                  where: {
                    followerId,
                  },
                }),
              ]),
            }),
          ]),
          where: {
            followerId,
            status: followerStatus.accepted,
          },
          subQuery: false,
        },
        paging,
      );
    });

    it('should findAllWithPaging on UserFollower table with iLike query on follower name', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const result = await getFollowing(paging, {
        followerId,
        status: followerStatus.accepted,
        reqUserId: followerId,
      });

      expect(result).toEqual(mockFollowing);
      expect(db.UserFollower.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'following',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'email',
                'avatar',
              ]),
              required: true,
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'follower',
                  attributes: expect.arrayContaining(['status']),
                  required: false,
                  where: {
                    followerId,
                  },
                }),
              ]),
            }),
          ]),
          where: {
            followerId,
            status: followerStatus.accepted,
            ['$following.name$']: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
          subQuery: false,
        },
        paging,
      );
    });
  });

  describe('getByValues', () => {
    it('should findOne on UserFollower', async () => {
      const userId = uuid.v4();
      const followerId = uuid.v4();
      const mockFollowData = {
        id: uuid.v4(),
        userId,
        followerId,
        status: followerStatus.accepted,
      };
      db.UserFollower.findOne.mockResolvedValue(mockFollowData);

      const result = await getByValues(userId, followerId);

      expect(result).toEqual(mockFollowData);
      expect(db.UserFollower.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          followerId,
        },
      });
    });
  });

  describe('getBulkIsFollowed', () => {
    it('should findAll on UserFollower', async () => {
      const userId = uuid.v4();
      const followerId = uuid.v4();
      const mockFollowData = {
        id: uuid.v4(),
        userId,
        followerId,
        status: followerStatus.accepted,
      };
      db.UserFollower.findAll.mockResolvedValue([mockFollowData]);

      const result = await getBulkIsFollowed([userId], followerId);

      expect(result).toEqual([mockFollowData]);
      expect(db.UserFollower.findAll).toHaveBeenCalledWith({
        where: {
          userId: {
            [db.Op.in]: [userId],
          },
          followerId,
        },
      });
    });
  });

  describe('insert', () => {
    it('should call create on UserFollower', async () => {
      const userId = uuid.v4();
      const followerId = uuid.v4();
      const status = followerStatus.requested;

      db.UserFollower.create.mockResolvedValue({
        id: uuid.v4(),
        userId,
        followerId,
        status,
      });

      const result = await insert(
        { userId, followerId, status },
        mockTransaction,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          userId,
          followerId,
          status,
        }),
      );
      expect(db.UserFollower.create).toHaveBeenCalledWith(
        { userId, followerId, status },
        {
          transaction: mockTransaction,
        },
      );
    });
    it('should call create without options on UserFollower if not provided with a transaction instance', async () => {
      const userId = uuid.v4();
      const followerId = uuid.v4();
      const status = followerStatus.requested;

      db.UserFollower.create.mockResolvedValue({
        id: uuid.v4(),
        userId,
        followerId,
        status,
      });

      await insert({ userId, followerId, status });
      expect(db.UserFollower.create).toHaveBeenCalledWith(
        { userId, followerId, status },
        undefined,
      );
    });
  });

  describe('update', () => {
    it('should call update and change status field on UserFollower, return the update count', async () => {
      const userId = uuid.v4();
      const followerId = uuid.v4();
      const status = followerStatus.accepted;
      db.UserFollower.update.mockResolvedValue([1, undefined]);

      const result = await update(
        { userId, followerId, status },
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.UserFollower.update).toHaveBeenCalledWith(
        { status },
        {
          where: {
            userId,
            followerId,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('upsert', () => {
    it('should call upsert on UserFollower', async () => {
      const userId = uuid.v4();
      const followerId = uuid.v4();
      const mockFollowData = {
        id: uuid.v4(),
        userId,
        followerId,
        status: followerStatus.accepted,
      };
      db.UserFollower.upsert.mockResolvedValueOnce([
        {
          toJSON: () => mockFollowData,
        },
      ]);

      const result = await upsert(
        { userId, followerId, status: followerStatus.accepted },
        mockTransaction,
      );

      expect(result).toEqual(mockFollowData);
      expect(db.UserFollower.upsert).toHaveBeenCalledWith(
        { userId, followerId, status: followerStatus.accepted },
        { transaction: mockTransaction },
      );
    });
  });

  describe('delete', () => {
    it('should remove a follower record from UserFollower and return deleted count', async () => {
      db.UserFollower.destroy.mockResolvedValueOnce(1);
      const userId = uuid.v4();
      const followerId = uuid.v4();
      const status = followerStatus.accepted;

      const result = await deleteFollow(
        { userId, followerId, status },
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.UserFollower.destroy).toHaveBeenCalledWith({
        where: {
          userId,
          followerId,
          status,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('deleteUserReference', () => {
    it('should remove all records related to specified user id, whether as follower, or as followed', async () => {
      const userId = uuid.v4();
      db.UserFollower.destroy.mockResolvedValueOnce(10);

      const result = await deleteUserReference(userId, mockTransaction);

      expect(result).toEqual(10);
      expect(db.UserFollower.destroy).toHaveBeenCalledWith({
        where: {
          [db.Op.or]: [
            {
              userId,
            },
            {
              followerId: userId,
            },
          ],
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getFollowSummary', () => {
    it('should return the user follower & following count', async () => {
      const userId = uuid.v4();
      db.UserFollower.count.mockResolvedValueOnce(5);
      db.UserFollower.count.mockResolvedValueOnce(10);

      const result = await getFollowSummary(userId);

      expect(result).toEqual({
        followerCount: 10,
        followingCount: 5,
      });
      expect(db.UserFollower.count).toHaveBeenCalledTimes(2);
      expect(db.UserFollower.count).toHaveBeenCalledWith({
        where: {
          followerId: userId,
          status: followerStatus.accepted,
        },
      });
      expect(db.UserFollower.count).toHaveBeenCalledWith({
        where: {
          userId,
          status: followerStatus.accepted,
        },
      });
    });
  });

  describe('getTopCountryUser', () => {
    it('should query top country user that has not been followed by the user', async () => {
      const paging = { page: 1, size: 10 };
      const country = 'us';
      const userId = uuid.v4();

      await getTopCountryUser(paging, { country, userId });

      expect(db.UserProfile.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: expect.arrayContaining([
            'id',
            'name',
            'avatar',
            'isPrivate',
            'country',
            [
              db.Sequelize.literal(
                `(SELECT COUNT(*) FROM "UserFollowers" AS "folDB" WHERE "UserProfile"."id" = "folDB"."userId" AND "folDB"."status" = '${followerStatus.accepted}')`,
              ),
              'followerCount',
            ],
          ]),
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'follower',
              required: false,
              where: {
                followerId: userId,
              },
            }),
            expect.objectContaining({
              as: 'following',
              required: false,
              where: {
                userId,
              },
            }),
          ]),
          where: {
            ['$follower.followerId$']: {
              [db.Op.eq]: null,
            },
            country,
            id: {
              [db.Op.ne]: userId,
            },
            [db.Op.or]: [
              {
                ['$following.userId$']: {
                  [db.Op.eq]: null,
                },
              },
              {
                ['$following.status$']: {
                  [db.Op.ne]: followerStatus.blocked,
                },
              },
            ],
          },
          subQuery: false,
        },
        {
          ...paging,
          defaultSort: [[db.Sequelize.literal('"followerCount"'), 'DESC']],
        },
      );
    });

    it('should return top user worldwide that has not been followed by the user if not provided with country parameter', async () => {
      const paging = { page: 1, size: 10 };
      const userId = uuid.v4();

      await getTopCountryUser(paging, { userId });

      expect(db.UserProfile.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ['$follower.followerId$']: {
              [db.Op.eq]: null,
            },
            id: {
              [db.Op.ne]: userId,
            },
            [db.Op.or]: [
              {
                ['$following.userId$']: {
                  [db.Op.eq]: null,
                },
              },
              {
                ['$following.status$']: {
                  [db.Op.ne]: followerStatus.blocked,
                },
              },
            ],
          },
        }),
        {
          ...paging,
          defaultSort: [[db.Sequelize.literal('"followerCount"'), 'DESC']],
        },
      );
    });
  });

  describe('getTopVelocityUser', () => {
    it('should query country user that is rising recently and has not been followed by the user', async () => {
      const paging = { page: 1, size: 10 };
      const country = 'us';
      const userId = uuid.v4();

      await getTopVelocityUser(paging, { country, userId });

      expect(db.UserProfile.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: expect.arrayContaining([
            'id',
            'name',
            'avatar',
            'isPrivate',
            'country',
          ]),
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'follower',
              required: false,
              where: {
                followerId: userId,
              },
            }),
            expect.objectContaining({
              as: 'following',
              required: false,
              where: {
                userId,
              },
            }),
          ]),
          where: {
            ['$follower.followerId$']: {
              [db.Op.eq]: null,
            },
            country,
            id: {
              [db.Op.ne]: userId,
            },
            [db.Op.or]: [
              {
                ['$following.userId$']: {
                  [db.Op.eq]: null,
                },
              },
              {
                ['$following.status$']: {
                  [db.Op.ne]: followerStatus.blocked,
                },
              },
            ],
          },
          subQuery: false,
        },
        {
          ...paging,
          defaultSort: [[db.Sequelize.literal('"followerGained"'), 'DESC']],
        },
      );
    });

    it('should return user worldwide rising recently that has not been followed by the user if not provided with country parameter', async () => {
      const paging = { page: 1, size: 10 };
      const userId = uuid.v4();

      await getTopVelocityUser(paging, { userId });

      expect(db.UserProfile.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ['$follower.followerId$']: {
              [db.Op.eq]: null,
            },
            id: {
              [db.Op.ne]: userId,
            },
            [db.Op.or]: [
              {
                ['$following.userId$']: {
                  [db.Op.eq]: null,
                },
              },
              {
                ['$following.status$']: {
                  [db.Op.ne]: followerStatus.blocked,
                },
              },
            ],
          },
        }),
        {
          ...paging,
          defaultSort: [[db.Sequelize.literal('"followerGained"'), 'DESC']],
        },
      );
    });
  });

  describe('searchFollowedUser', () => {
    it('should call findAndCountAll on UserProfile with provided parameters', async () => {
      const userId = uuid.v4();
      const searchedName = faker.name.findName();

      await searchFollowedUser(
        { page: 1, size: 10, name: searchedName },
        userId,
      );

      expect(db.UserProfile.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.arrayContaining([
            'id',
            'name',
            'avatar',
            'isPrivate',
            'country',
            'bio',
            'sailingNumber',
          ]),
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'follower',
              required: true,
              where: {
                followerId: userId,
                status: followerStatus.accepted,
              },
            }),
          ]),
          where: expect.objectContaining({
            name: {
              [db.Op.iLike]: `%${searchedName}%`,
            },
          }),
          subQuery: false,
        }),
      );
    });
  });

  describe('getBidirectionalFollowStatus', () => {
    it('should return follow status of the user and target, and return isBlocking and isBlocked as false no blocking is detected', async () => {
      const userId = uuid.v4();
      const targetUser = uuid.v4();
      db.UserFollower.findAll.mockResolvedValueOnce([
        { userId, followerId: targetUser, status: followerStatus.accepted },
        {
          userId: targetUser,
          followerId: userId,
          status: followerStatus.requested,
        },
      ]);

      const result = await getBidirectionalFollowStatus(targetUser, userId);

      expect(result).toEqual({
        isBlocking: false,
        isBlocked: false,
        followStatus: followerStatus.requested,
      });
    });

    it('should return follow status of the user and target, and return isBlocking and isBlocked as true if either blocks the other', async () => {
      const userId = uuid.v4();
      const targetUser = uuid.v4();
      db.UserFollower.findAll.mockResolvedValueOnce([
        { userId, followerId: targetUser, status: followerStatus.blocked },
        {
          userId: targetUser,
          followerId: userId,
          status: followerStatus.blocked,
        },
      ]);

      const result = await getBidirectionalFollowStatus(targetUser, userId);

      expect(result).toEqual({
        isBlocking: true,
        isBlocked: true,
        followStatus: followerStatus.blocked,
      });
    });
  });
});
