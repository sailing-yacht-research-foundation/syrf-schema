const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const { bulkCreate } = require('../../dataAccess/v1/competitionResult');

const db = require('../../index');

describe('Competition Result DAL', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate', async () => {
      const mockTransaction = db.sequelize.transaction();
      const data = Array(3)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            competitionUnitId: uuid.v4(),
            vesselParticipantId: uuid.v4(),
            finishTime: new Date(),
            time: faker.datatype.number({ max: 10000 }),
            rank: faker.datatype.number({ min: 1, max: 100 }),
            isRecalculated: false,
          };
        });
      await bulkCreate(data, mockTransaction);

      expect(db.CompetitionResult.bulkCreate).toHaveBeenCalledWith(data, {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      });
    });
    it('should skip db calls if provided with empty array', async () => {
      const result = await bulkCreate([]);
      expect(result).toEqual([]);
      expect(db.CompetitionResult.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
