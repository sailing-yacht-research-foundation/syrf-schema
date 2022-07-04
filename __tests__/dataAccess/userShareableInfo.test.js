const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  upsert,
  update,
  getById,
  delete: deleteSharable,
} = require('../../dataAccess/v1/userShareableInfo');

const db = require('../../index');

describe('User Shareable Info', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('upsert', () => {
    it('should call upsert and return the inserted data', async () => {
      const mockSharableData = {
        userId: uuid.v4(),
        emergencyContactName: faker.name.findName(),
        emergencyContactPhone: faker.random.numeric(12),
        emergencyContactEmail: faker.internet.email(),
      };
      db.UserShareableInfo.upsert.mockResolvedValueOnce([
        { toJSON: () => mockSharableData },
      ]);

      const result = await upsert(mockSharableData, mockTransaction);

      expect(result).toEqual(mockSharableData);
      expect(db.UserShareableInfo.upsert).toHaveBeenCalledWith(
        mockSharableData,
        { transaction: mockTransaction },
      );
    });
  });

  describe('update', () => {
    it('should call update on UserSharableInfo table', async () => {
      const userId = uuid.v4();
      const data = {
        emergencyContactName: faker.name.findName(),
        emergencyContactPhone: faker.random.numeric(12),
        emergencyContactEmail: faker.internet.email(),
      };
      db.UserShareableInfo.update.mockResolvedValueOnce([
        1,
        { userId, ...data },
      ]);

      const result = await update(userId, data, mockTransaction);

      expect(result).toEqual([1, { userId, ...data }]);
      expect(db.UserShareableInfo.update).toHaveBeenCalledWith(data, {
        where: {
          userId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getById', () => {
    it('should call findByPk on UserSharableInfo table and return the value', async () => {
      const data = {
        userId: uuid.v4(),
        emergencyContactName: faker.name.findName(),
        emergencyContactPhone: faker.random.numeric(12),
        emergencyContactEmail: faker.internet.email(),
      };
      db.UserShareableInfo.findByPk.mockResolvedValueOnce(data);

      const result = await getById(data.userId);

      expect(result).toEqual(data);
      expect(db.UserShareableInfo.findByPk).toHaveBeenCalledWith(data.userId, {
        raw: true,
      });
    });
  });

  describe('delete', () => {
    it('should call destroy on UserShareableInfo table and return deleted value', async () => {
      const data = {
        userId: uuid.v4(),
        emergencyContactName: faker.name.findName(),
        emergencyContactPhone: faker.random.numeric(12),
        emergencyContactEmail: faker.internet.email(),
      };
      db.UserShareableInfo.findByPk.mockResolvedValueOnce({
        toJSON: () => data,
      });
      db.UserShareableInfo.destroy.mockResolvedValueOnce(1);

      const result = await deleteSharable(data.userId, mockTransaction);

      expect(result).toEqual(data);
      expect(db.UserShareableInfo.destroy).toHaveBeenCalledWith({
        where: { userId: data.userId },
        transaction: mockTransaction,
      });
    });

    it('should skip destroy when findByPk returns nothing', async () => {
      db.UserShareableInfo.findByPk.mockResolvedValueOnce(undefined);

      const result = await deleteSharable(uuid.v4());

      expect(result).toEqual(undefined);
      expect(db.UserShareableInfo.destroy).not.toHaveBeenCalled();
    });
  });
});
