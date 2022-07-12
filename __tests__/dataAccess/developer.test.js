const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  getById,
  create,
  delete: deleteDeveloper,
} = require('../../dataAccess/v1/developer');

const db = require('../../index');

describe('Developer DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });
  describe('getById', () => {
    it('should findByPk Developer table', async () => {
      const data = {
        id: uuid.v4(),
        name: faker.name.findName(),
        email: faker.internet.email(),
      };
      db.Developer.findByPk.mockResolvedValueOnce(data);

      const result = await getById(data.id);

      expect(result).toEqual(data);
      expect(db.Developer.findByPk).toHaveBeenCalledWith(data.id, {
        raw: true,
      });
    });
  });

  describe('create', () => {
    it('should create a Developer record and update UserProfile with the developer id', async () => {
      const devData = {
        name: faker.name.findName(),
        email: faker.internet.email(),
      };
      const userProfileId = uuid.v4();

      db.Developer.create.mockImplementationOnce((data) => {
        return {
          toJSON: () => {
            return { ...data };
          },
        };
      });
      db.UserProfile.update.mockResolvedValueOnce([1, undefined]);

      const result = await create(
        { id: userProfileId, ...devData },
        mockTransaction,
      );

      expect(result).toEqual([1, undefined]);
      expect(db.Developer.create).toHaveBeenCalledWith(
        { id: expect.any(String), ...devData },
        {
          transaction: mockTransaction,
        },
      );
      expect(db.UserProfile.update).toHaveBeenCalledWith(
        { developerAccountId: expect.any(String) },
        {
          where: {
            id: userProfileId,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('delete', () => {
    it('should find related user account, destroy developer record, and update user account data', async () => {
      const userData = {
        id: uuid.v4(),
        developerAccountId: uuid.v4(),
      };
      db.UserProfile.findOne.mockResolvedValueOnce({ toJSON: () => userData });
      db.Developer.destroy.mockResolvedValueOnce(1);

      const result = await deleteDeveloper(
        userData.developerAccountId,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.Developer.destroy).toHaveBeenCalledWith({
        where: {
          id: userData.developerAccountId,
        },
        transaction: mockTransaction,
      });
      expect(db.UserProfile.update).toHaveBeenCalledWith(
        {
          developerAccountId: null,
        },
        {
          where: {
            id: userData.id,
          },
          transaction: mockTransaction,
        },
      );
    });

    it('should skip updating user data when no related user account found', async () => {
      const id = uuid.v4();
      db.UserProfile.findOne.mockResolvedValueOnce(undefined);
      db.Developer.destroy.mockResolvedValueOnce(1);

      const result = await deleteDeveloper(id, mockTransaction);

      expect(result).toEqual(1);
      expect(db.Developer.destroy).toHaveBeenCalledWith({
        where: {
          id,
        },
        transaction: mockTransaction,
      });
      expect(db.UserProfile.update).not.toHaveBeenCalled();
    });
  });
});
