const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

// tested
const competitionUnitDAL = require('../../dataAccess/v1/competitionUnit');

const db = require('../../index');

describe('Competition Unit DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('update', () => {
    it('should work with single id', async () => {
      const parameters = [uuid.v4(), faker.datatype.json(), mockTransaction];

      db.CompetitionUnit.update.mockResolvedValueOnce([1, parameters[1]]);

      const result = await competitionUnitDAL.update(...parameters);

      expect(result).toEqual({ updateCount: 1, updatedData: parameters[1] });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(parameters[1], {
        where: {
          id: {
            [db.Op.in]: [parameters[0]],
          },
        },
        returning: true,
        transaction: mockTransaction,
      });
    });

    it('should work with multiple ids', async () => {
      const parameters = [
        Array.from(Array(faker.datatype.number({ min: 2, max: 30 }))).map(() =>
          uuid.v4(),
        ),
        faker.datatype.json(),
        mockTransaction,
      ];

      db.CompetitionUnit.update.mockResolvedValueOnce([
        parameters[0].length,
        parameters[1],
      ]);

      const result = await competitionUnitDAL.update(...parameters);

      expect(result).toEqual({
        updateCount: parameters[0].length,
        updatedData: parameters[1],
      });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(parameters[1], {
        where: {
          id: {
            [db.Op.in]: parameters[0],
          },
        },
        returning: true,
        transaction: mockTransaction,
      });
    });
  });
});
