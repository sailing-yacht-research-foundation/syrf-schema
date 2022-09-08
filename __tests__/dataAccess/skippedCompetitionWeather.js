const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  create,
  checkSkippedCompetition,
} = require('../../dataAccess/v1/skippedCompetitionWeather');

const db = require('../../index');

describe('Skipped Slice Competition DAL', () => {
  const mockData = {
    id: uuid.v4(),
    competitionUnitId: uuid.v4(),
    totalFileCount: faker.datatype.number({ min: 100 }),
    message: 'File exceeded slice limit of 10.',
    createdAt: new Date(),
  };
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should call create on SkippedCompetitionWeather table', async () => {
      db.SkippedCompetitionWeather.create.mockResolvedValueOnce(mockData);
      const result = await create(mockData, mockTransaction);

      expect(result).toEqual(mockData);
      expect(db.SkippedCompetitionWeather.create).toHaveBeenCalledWith(
        mockData,
        {
          validate: true,
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('checkSkippedCompetition', () => {
    it('should return true when data is found', async () => {
      db.SkippedCompetitionWeather.findOne.mockResolvedValueOnce(mockData);
      const result = await checkSkippedCompetition(mockData.competitionUnitId);

      expect(result).toEqual(true);
      expect(db.SkippedCompetitionWeather.findOne).toHaveBeenCalledWith({
        where: {
          competitionUnitId: mockData.competitionUnitId,
        },
      });
    });
    it('should return false when data is not found', async () => {
      db.SkippedCompetitionWeather.findOne.mockResolvedValueOnce(undefined);
      const result = await checkSkippedCompetition(mockData.competitionUnitId);

      expect(result).toEqual(false);
      expect(db.SkippedCompetitionWeather.findOne).toHaveBeenCalledWith({
        where: {
          competitionUnitId: mockData.competitionUnitId,
        },
      });
    });
  });
});
