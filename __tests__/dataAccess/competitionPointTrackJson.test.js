const uuid = require('uuid');

const { bulkCreate } = require('../../dataAccess/v1/competitionPointTrackJson');

const db = require('../../index');

describe('Competition Point Track DAL', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate', async () => {
      const mockTransaction = db.sequelize.transaction();
      const data = Array(2)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            competitionUnitId: uuid.v4(),
            pointId: uuid.v4(),
            storageKey: 'path/to/file.json',
          };
        });
      await bulkCreate(data, mockTransaction);

      expect(db.CompetitionPointTrackJson.bulkCreate).toHaveBeenCalledWith(
        data,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction: mockTransaction,
        },
      );
    });
    it('should skip db calls if provided with empty array', async () => {
      const result = await bulkCreate([]);
      expect(result).toEqual([]);
      expect(db.CompetitionPointTrackJson.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
