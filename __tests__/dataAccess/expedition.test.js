const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  upsert,
  deleteSubscription,
  getAllByUser,
  getAllSubs,
  getAllOngoingCUWithCourse,
  getAllOngoingCU,
  getById,
  getByCompetitionUnitId,
  getCompetitionUnitById,
  getCourseDetail,
  updateReplyPort,
  getExpiredSubscriptions,
} = require('../../dataAccess/v1/expedition');
const { competitionUnitStatus } = require('../../enums');

const db = require('../../index');

describe('Expedition DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  const defaultExpectedInclude = expect.arrayContaining([
    expect.objectContaining({
      as: 'competitionUnit',
      attributes: expect.arrayContaining([
        'id',
        'name',
        'status',
        'calendarEventId',
        'courseId',
      ]),
    }),
  ]);
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('upsert', () => {
    it('should destroy expedition subscription of the user with specified competition if exist before creating new record', async () => {
      const data = {
        userProfileId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        ipAddress: faker.internet.ipv4(),
        replyPort: faker.datatype.number({ min: 1000, max: 9000 }),
        expiredAt: new Date(),
      };
      db.ExpeditionSubscription.create.mockResolvedValueOnce({
        toJSON: () => {
          return { id: uuid.v4(), ...data };
        },
      });

      const result = await upsert(data, mockTransaction);

      expect(result).toEqual({
        id: expect.any(String),
        ...data,
      });
      expect(db.ExpeditionSubscription.destroy).toHaveBeenCalledWith({
        where: {
          userProfileId: data.userProfileId,
          competitionUnitId: data.competitionUnitId,
        },
      });
      expect(db.ExpeditionSubscription.create).toHaveBeenCalledWith(
        {
          id: expect.any(String),
          ...data,
        },
        { transaction: mockTransaction },
      );
    });
  });

  describe('deleteSubscription', () => {
    it('should destroy expedition subscription of the user with specified competition', async () => {
      const userProfileId = uuid.v4();
      const competitionUnitId = uuid.v4();

      db.ExpeditionSubscription.destroy.mockResolvedValueOnce(1);

      const result = await deleteSubscription(
        {
          userProfileId,
          competitionUnitId,
        },
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.ExpeditionSubscription.destroy).toHaveBeenCalledWith({
        where: {
          userProfileId,
          competitionUnitId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getAllByUser', () => {
    it('should findAllWithPaging on ExpeditionSubscription', async () => {
      const userId = uuid.v4();
      const paging = { page: 1, size: 10 };

      await getAllByUser(userId, paging);

      expect(db.ExpeditionSubscription.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            userProfileId: userId,
          },
          include: defaultExpectedInclude,
        },
        paging,
      );
    });
    it('should work without being provided a paging', async () => {
      const userId = uuid.v4();
      await getAllByUser(userId);

      expect(db.ExpeditionSubscription.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            userProfileId: userId,
          },
          include: defaultExpectedInclude,
        },
        {},
      );
    });
  });

  describe('getAllSubs', () => {
    it('should findAll ExpeditionSubscription without any condition', async () => {
      await getAllSubs();

      expect(db.ExpeditionSubscription.findAll).toHaveBeenCalledWith({
        raw: true,
      });
    });
  });

  describe('getAllOngoingCUWithCourse', () => {
    it('should findAll Competition where status is ONGOING and course set', async () => {
      await getAllOngoingCUWithCourse();

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: competitionUnitStatus.ONGOING,
          courseId: {
            [db.Op.ne]: null,
          },
        }),
        raw: true,
      });
    });
  });

  describe('getAllOngoingCU', () => {
    it('should findAll ExpeditionSubscription without any condition', async () => {
      await getAllOngoingCU();

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: competitionUnitStatus.ONGOING,
        }),
        raw: true,
      });
    });
  });

  describe('getById', () => {
    it('should findByPk ExpecditionSubscription and return the result', async () => {
      const data = {
        id: uuid.v4(),
        userProfileId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        ipAddress: faker.internet.ipv4(),
        replyPort: faker.datatype.number({ min: 1000, max: 9000 }),
        expiredAt: new Date(),
      };
      db.ExpeditionSubscription.findByPk.mockResolvedValueOnce({
        toJSON: () => data,
      });

      const result = await getById(data.id);

      expect(result).toEqual(data);
      expect(db.ExpeditionSubscription.findByPk).toHaveBeenCalledWith(data.id, {
        include: defaultExpectedInclude,
      });
    });
  });

  describe('getByCompetitionUnitId', () => {
    it('should findOne ExpeditionSubscription using competition id and user id', async () => {
      const competitionUnitId = uuid.v4();
      const userProfileId = uuid.v4();
      const data = {
        id: uuid.v4(),
        userProfileId,
        competitionUnitId,
        ipAddress: faker.internet.ipv4(),
        replyPort: faker.datatype.number({ min: 1000, max: 9000 }),
        expiredAt: new Date(),
      };
      db.ExpeditionSubscription.findOne.mockResolvedValueOnce({
        toJSON: () => data,
      });

      const result = await getByCompetitionUnitId(
        competitionUnitId,
        userProfileId,
      );

      expect(result).toEqual(data);
      expect(db.ExpeditionSubscription.findOne).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
          userProfileId,
        },
        include: defaultExpectedInclude,
      });
    });
  });

  describe('getCompetitionUnitById', () => {
    it('should find a competition unit by id and include event and course detail', async () => {
      const data = {
        id: uuid.v4(),
        name: `Competition of ${faker.random.word()}`,
        calendarEvent: {
          id: uuid.v4(),
          name: `Event ${faker.random.words()}`,
          isPrivate: false,
          ownerId: uuid.v4(),
        },
        course: {
          id: uuid.v4(),
          name: faker.random.word(),
        },
      };
      db.CompetitionUnit.findByPk.mockResolvedValueOnce({ toJSON: () => data });

      const result = await getCompetitionUnitById(data.id);

      expect(result).toEqual(data);
      expect(db.CompetitionUnit.findByPk).toHaveBeenCalledWith(data.id, {
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'calendarEvent',
            attributes: expect.arrayContaining([
              'id',
              'name',
              'isPrivate',
              'ownerId',
            ]),
          }),
          expect.objectContaining({
            as: 'course',
            attributes: expect.arrayContaining(['id', 'name']),
          }),
        ]),
      });
    });
  });

  describe('getCourseDetail', () => {
    it('should find course by course id', async () => {
      const courseData = {
        id: uuid.v4(),
        name: faker.random.words(),
      };
      db.Course.findByPk.mockResolvedValueOnce({ toJSON: () => courseData });

      const result = await getCourseDetail(courseData.id);

      expect(result).toEqual(courseData);
      expect(db.Course.findByPk).toHaveBeenCalledWith(courseData.id, {
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'courseSequencedGeometries',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'points',
              }),
            ]),
          }),
          expect.objectContaining({
            as: 'courseUnsequencedUntimedGeometry',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'points',
                include: expect.arrayContaining([
                  expect.objectContaining({
                    as: 'tracker',
                  }),
                ]),
              }),
            ]),
          }),
          expect.objectContaining({
            as: 'courseUnsequencedTimedGeometry',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'points',
                include: expect.arrayContaining([
                  expect.objectContaining({
                    as: 'tracker',
                  }),
                ]),
              }),
            ]),
          }),
          expect.objectContaining({
            as: 'event',
            attributes: expect.arrayContaining(['id', 'name']),
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'editors',
                attributes: expect.arrayContaining(['id', 'name']),
              }),
              expect.objectContaining({
                as: 'owner',
                attributes: expect.arrayContaining(['id', 'name']),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('updateReplyPort', () => {
    it('should update ExpeditionSubscription with provided port', async () => {
      const ipAddress = faker.internet.ipv4();
      const port = faker.datatype.number({ min: 100, max: 9999 });

      await updateReplyPort(ipAddress, port, mockTransaction);

      expect(db.ExpeditionSubscription.update).toHaveBeenCalledWith(
        {
          replyPort: port,
        },
        {
          where: {
            ipAddress,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('getExpiredSubscriptions', () => {
    it('should findAll ExpeditionSubscription by date parameter', async () => {
      const date = new Date();
      await getExpiredSubscriptions(date);

      expect(db.ExpeditionSubscription.findAll).toHaveBeenCalledWith({
        where: {
          expiredAt: {
            [db.Op.lte]: date,
          },
        },
        raw: true,
      });
    });

    it('should use current date when not provided', async () => {
      await getExpiredSubscriptions();

      expect(db.ExpeditionSubscription.findAll).toHaveBeenCalledWith({
        where: {
          expiredAt: {
            [db.Op.lte]: expect.any(Date),
          },
        },
        raw: true,
      });
    });
  });
});
