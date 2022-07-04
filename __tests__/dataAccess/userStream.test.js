const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  getStreams,
  getStreamByUser,
  getStreamByCompetition,
  getById,
  insert,
  update,
  bulkStopStream,
} = require('../../dataAccess/v1/userStream');
const { ivsLatencyMode, ivsTypeEnum } = require('../../enums');

const db = require('../../index');

describe('User Stream DAL', () => {
  const userId = uuid.v4();
  const mockUserStreams = Array(5)
    .fill()
    .map(() => {
      return {
        id: uuid.v4(),
        userId,
        isLive: false,
        competitionUnitId: uuid.v4(),
        streamName: `${faker.name.findName()}'s stream`,
        saveRecording: false,
        ivsChannelArn: faker.random.alphaNumeric(10),
        ivsChannelName: faker.name.findName(),
        ivsIngestEndpoint: '127.0.0.1',
        ivsPlaybackUrl: faker.internet.url(),
        streamKey: faker.random.alphaNumeric(32),
        streamKeyArn: faker.random.alphaNumeric(10),
        privateStream: false,
        latencyMode: ivsLatencyMode.LOW,
        ivsType: ivsTypeEnum.BASIC,
      };
    });
  const findAllWithPagingTemplate = {
    count: 0,
    rows: [],
    page: 1,
    size: 10,
    sort: 'updatedAt',
    srdir: 'DESC',
    q: '',
    filters: [],
  };
  const mockTransaction = db.sequelize.transaction();

  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getStreams', () => {
    it('should call findAllWithPaging with provided paging parameters', async () => {
      const paging = { page: 1, size: 10, query: '' };
      db.UserStream.findAllWithPaging.mockResolvedValueOnce({
        ...findAllWithPagingTemplate,
        count: mockUserStreams.length,
        rows: mockUserStreams,
      });

      const result = await getStreams(paging);

      expect(result.rows).toEqual(mockUserStreams);
      expect(db.UserStream.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'user',
              attributes: expect.arrayContaining(['id', 'name', 'avatar']),
              required: true,
            }),
          ]),
          where: {},
        },
        paging,
      );
    });

    it('should add ilike query when provided with a query', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      db.UserStream.findAllWithPaging.mockResolvedValueOnce({
        ...findAllWithPagingTemplate,
        count: mockUserStreams.length,
        rows: mockUserStreams,
      });

      const result = await getStreams(paging);

      expect(result.rows).toEqual(mockUserStreams);
      expect(db.UserStream.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'user',
              attributes: expect.arrayContaining(['id', 'name', 'avatar']),
              required: true,
            }),
          ]),
          where: {
            ['$user.name$']: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
        },
        paging,
      );
    });
  });

  describe('getStreamByUser', () => {
    it('should call findAll to UserStream table', async () => {
      db.UserStream.findAll.mockResolvedValueOnce(mockUserStreams);

      const result = await getStreamByUser(userId);

      expect(result).toEqual(mockUserStreams);
      expect(db.UserStream.findAll).toHaveBeenCalledWith({
        where: { userId },
      });
    });
    it('should have isLive on where condition when provided with a value', async () => {
      db.UserStream.findAll.mockResolvedValueOnce(mockUserStreams);

      const result = await getStreamByUser(userId, false);

      expect(result).toEqual(mockUserStreams);
      expect(db.UserStream.findAll).toHaveBeenCalledWith({
        where: { userId, isLive: false },
      });
    });
  });

  describe('getStreamByCompetition', () => {
    it('should return all streams related to a competition', async () => {
      const competitionUnitId = uuid.v4();
      db.UserStream.findAll.mockResolvedValueOnce(mockUserStreams);

      const result = await getStreamByCompetition(competitionUnitId);

      expect(result).toEqual(mockUserStreams);
      expect(db.UserStream.findAll).toHaveBeenCalledWith({
        where: { competitionUnitId },
      });
    });
    it('should have isLive on where condition when provided with a value', async () => {
      const competitionUnitId = uuid.v4();
      db.UserStream.findAll.mockResolvedValueOnce(mockUserStreams);

      const result = await getStreamByCompetition(competitionUnitId, true);

      expect(result).toEqual(mockUserStreams);
      expect(db.UserStream.findAll).toHaveBeenCalledWith({
        where: { competitionUnitId, isLive: true },
      });
    });
  });

  describe('getById', () => {
    it('should call findOne on UserStream table', async () => {
      const streamId = mockUserStreams[0].id;
      db.UserStream.findOne.mockResolvedValueOnce(
        mockUserStreams.find((row) => {
          return row.id === streamId;
        }),
      );

      const result = await getById(streamId);

      expect(result).toEqual(mockUserStreams[0]);
      expect(db.UserStream.findOne).toHaveBeenCalledWith({
        where: { id: streamId },
      });
    });
  });

  describe('insert', () => {
    it('should call create on UserStream with provided data', async () => {
      const { id, ...streamData } = mockUserStreams[0];
      db.UserStream.create.mockResolvedValueOnce({
        id: uuid.v4(),
        ...streamData,
      });

      const result = await insert(streamData, mockTransaction);

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          ...streamData,
        }),
      );
      expect(db.UserStream.create).toHaveBeenCalledWith(streamData, {
        transaction: mockTransaction,
      });
    });

    it('should call create on UserStream with default values when some are missing', async () => {
      const { id, privateStream, saveRecording, ...streamData } =
        mockUserStreams[0];
      db.UserStream.create.mockResolvedValueOnce({
        id: uuid.v4(),
        ...streamData,
        privateStream: false,
        saveRecording: false,
      });

      const result = await insert(streamData);

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          privateStream: false,
          saveRecording: false,
          ...streamData,
        }),
      );
      expect(db.UserStream.create).toHaveBeenCalledWith(
        {
          ...streamData,
          privateStream: false,
          saveRecording: false,
        },
        undefined,
      );
    });
  });

  describe('update', () => {
    it('should call update based on stream id on UserStream table and update only parameters provided', async () => {
      db.UserStream.update.mockResolvedValueOnce([1]);
      const id = uuid.v4();

      const result = await update(
        { id },
        { isLive: false, invalidField: faker.random.word() },
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.UserStream.update).toHaveBeenCalledWith(
        { isLive: false },
        {
          where: {
            id,
          },
          transaction: mockTransaction,
        },
      );
    });

    it('should call update based on competition id on UserStream table and update only allowed parameters provided', async () => {
      db.UserStream.update.mockResolvedValueOnce([1]);
      const competitionUnitId = uuid.v4();

      const inputParameters = {
        ivsChannelName: faker.name.findName(),
        privateStream: true,
        latencyMode: ivsLatencyMode.LOW,
        ivsType: ivsTypeEnum.BASIC,
        invalidField: faker.random.word(),
      };
      const result = await update(
        { competitionUnitId },
        inputParameters,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.UserStream.update).toHaveBeenCalledWith(
        {
          ivsChannelName: inputParameters.ivsChannelName,
          privateStream: inputParameters.privateStream,
          latencyMode: inputParameters.latencyMode,
          ivsType: inputParameters.ivsType,
        },
        {
          where: {
            competitionUnitId,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('bulkStopStream', () => {
    it('should update all provided streams isLive to false', async () => {
      const idList = Array(5)
        .fill()
        .map(() => uuid.v4());
      db.UserStream.update.mockResolvedValueOnce([
        idList.length,
        idList.map((row) => {
          return {
            id: row,
          };
        }),
      ]);

      const result = await bulkStopStream(idList, mockTransaction);

      expect(result).toEqual({
        updateCount: idList.length,
        stoppedIds: idList,
      });
    });
  });
});
