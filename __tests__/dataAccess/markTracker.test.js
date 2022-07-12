const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  upsert,
  getAll,
  getById,
  delete: deleteMarkTracker,
  getEvent,
  getAllByEvent,
  bulkCreate,
} = require('../../dataAccess/v1/markTracker');

const db = require('../../index');

describe('Mark Tracker DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  const defaultExpectedInclude = expect.arrayContaining([
    expect.objectContaining({
      as: 'user',
      attributes: expect.arrayContaining(['id', 'name']),
    }),
  ]);
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('upsert', () => {
    beforeAll(() => {
      db.MarkTracker.upsert.mockImplementation(async (detail, _transaction) => {
        return [
          {
            toJSON: () => {
              return { ...detail };
            },
          },
          true,
        ];
      });
    });
    afterAll(() => {
      db.MarkTracker.upsert.mockReset();
    });
    it('should call upsert on MarkTracker and create random uuid when not provided', async () => {
      const data = {
        name: `Mark #${faker.random.numeric(2)}`,
        trackerUrl: faker.internet.url(),
        calendarEventId: uuid.v4(),
      };

      const result = await upsert(undefined, data, mockTransaction);

      expect(result).toEqual({
        ...data,
        id: expect.any(String),
      });
      expect(db.MarkTracker.upsert).toHaveBeenCalledWith(
        { ...data, id: expect.any(String) },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on MarkTracker and use provided uuid', async () => {
      const id = uuid.v4();
      const data = {
        name: `Mark #${faker.random.numeric(2)}`,
        trackerUrl: faker.internet.url(),
        calendarEventId: uuid.v4(),
      };

      const result = await upsert(id, data, mockTransaction);

      expect(result).toEqual({
        id,
        ...data,
      });
      expect(db.MarkTracker.upsert).toHaveBeenCalledWith(
        { ...data, id },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const markTrackerId = uuid.v4();

      const result = await upsert(markTrackerId);

      expect(result).toEqual({ id: markTrackerId });
      expect(db.MarkTracker.upsert).toHaveBeenCalledWith(
        { id: markTrackerId },
        { transaction: undefined },
      );
    });
  });

  describe('getAll', () => {
    const markTrackers = {
      count: 0,
      rows: [],
      page: 1,
      size: 10,
      sort: 'updatedAt',
      srdir: 'DESC',
      q: '',
      filters: [],
    };
    beforeAll(() => {
      db.MarkTracker.findAllWithPaging.mockResolvedValue(markTrackers);
    });
    afterAll(() => {
      db.MarkTracker.findAllWithPaging.mockReset();
    });
    it('should findAll mark tracker without condition if not provided with event nor query', async () => {
      const paging = { page: 1, size: 10 };

      const result = await getAll(paging);

      expect(result).toEqual(markTrackers);
      expect(db.MarkTracker.findAllWithPaging).toHaveBeenCalledWith(
        { where: {} },
        paging,
      );
    });
    it('should findAll mark tracker of a specific calendar event, and name matching provided query', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const calendarEventId = uuid.v4();

      const result = await getAll(paging, calendarEventId);

      expect(result).toEqual(markTrackers);
      expect(db.MarkTracker.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            calendarEventId,
            name: {
              [db.Op.like]: '%test%',
            },
          },
        },
        paging,
      );
    });
  });

  describe('getById', () => {
    it('should findByPk to MarkTracker and return the value', async () => {
      const markTrackerId = uuid.v4();
      const expectedData = {
        id: markTrackerId,
        name: `Mark #${faker.random.numeric(2)}`,
        trackerUrl: faker.internet.url(),
        calendarEventId: uuid.v4(),
      };
      db.MarkTracker.findByPk.mockResolvedValueOnce({
        toJSON: () => expectedData,
      });

      const result = await getById(markTrackerId);

      expect(result).toEqual(expectedData);
      expect(db.MarkTracker.findByPk).toHaveBeenCalledWith(markTrackerId, {
        include: defaultExpectedInclude,
      });
    });
  });

  describe('delete', () => {
    it('should destroy MarkTracker and return the detail if found', async () => {
      const markTrackerDetail = {
        id: uuid.v4(),
        name: `Mark #${faker.random.numeric(2)}`,
        trackerUrl: faker.internet.url(),
        calendarEventId: uuid.v4(),
      };
      db.MarkTracker.findByPk.mockResolvedValueOnce({
        toJSON: () => markTrackerDetail,
      });
      db.MarkTracker.destroy.mockResolvedValueOnce(1);

      const result = await deleteMarkTracker(markTrackerDetail.id);

      expect(result).toEqual(markTrackerDetail);
      expect(db.MarkTracker.destroy).toHaveBeenCalledWith({
        where: { id: markTrackerDetail.id },
      });
    });
    it('should skip MarkTracker destroy if not found', async () => {
      db.MarkTracker.findByPk.mockResolvedValueOnce(undefined);

      const result = await deleteMarkTracker(uuid.v4());

      expect(result).toEqual(undefined);
      expect(db.MarkTracker.destroy).not.toHaveBeenCalled();
    });
  });

  describe('getEvent', () => {
    it('should return mark tracker detail with event data', async () => {
      const calendarEventId = uuid.v4();
      const markTrackerDetail = {
        id: uuid.v4(),
        name: `Mark #${faker.random.numeric(2)}`,
        trackerUrl: faker.internet.url(),
        calendarEventId,
        event: {
          id: calendarEventId,
          name: `Event #${faker.random.numeric(2)}`,
        },
      };
      db.MarkTracker.findByPk.mockResolvedValueOnce({
        toJSON: () => markTrackerDetail,
      });

      const result = await getEvent(markTrackerDetail.id);

      expect(result).toEqual(markTrackerDetail);
      expect(db.MarkTracker.findByPk).toHaveBeenCalledWith(
        markTrackerDetail.id,
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'event',
            }),
          ]),
        },
      );
    });
  });

  describe('getAllByEvent', () => {
    it('should findAll MarkTracker of a calendar event', async () => {
      const calendarEventId = uuid.v4();
      const markTrackers = Array(3)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            name: `Mark #${faker.random.numeric(2)}`,
            trackerUrl: faker.internet.url(),
            calendarEventId,
          };
        });
      db.MarkTracker.findAll.mockResolvedValueOnce(
        markTrackers.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getAllByEvent(calendarEventId);

      expect(result).toEqual(markTrackers);
      expect(db.MarkTracker.findAll).toHaveBeenCalledWith({
        where: { calendarEventId },
      });
    });
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on MarkTracker', async () => {
      const markTrackers = Array(3)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            name: `Mark #${faker.random.numeric(2)}`,
            trackerUrl: faker.internet.url(),
            calendarEventId: uuid.v4(),
          };
        });
      db.MarkTracker.bulkCreate.mockResolvedValueOnce(markTrackers);

      const result = await bulkCreate(markTrackers, mockTransaction);

      expect(result).toEqual(markTrackers);
      expect(db.MarkTracker.bulkCreate).toHaveBeenCalledWith(markTrackers, {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      });
    });
    it('should not insert to DB when provided with empty array', async () => {
      const result = await bulkCreate([]);

      expect(result).toEqual([]);
      expect(db.MarkTracker.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
