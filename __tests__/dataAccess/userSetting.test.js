const uuid = require('uuid');

const {
  bulkCreate,
  insert,
  getById,
  update,
  delete: deleteSetting,
} = require('../../dataAccess/v1/userSetting');

const db = require('../../index');
const { generateDefaultUserSettings } = require('../../utils/utils');

describe('User Setting', () => {
  const mockTransaction = db.sequelize.transaction();
  const { generalSettings, mobileSettings } = generateDefaultUserSettings();
  const userId = uuid.v4();
  const data = {
    id: userId,
    emailNotificationSettings: generalSettings,
    browserNotificationSettings: generalSettings,
    persistentNotificationSettings: generalSettings,
    mobileOnlyNotificationTypes: mobileSettings,
  };
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on UserSetting table and return the result', async () => {
      db.UserSetting.bulkCreate.mockResolvedValueOnce([data]);

      const result = await bulkCreate([data], mockTransaction);

      expect(result).toEqual([data]);
      expect(db.UserSetting.bulkCreate).toHaveBeenCalledWith([data], {
        transaction: mockTransaction,
        ignoreDuplicates: true,
        validate: true,
      });
    });

    it('should skip bulkCreate on UserSetting table and return empty array when provided with empty data', async () => {
      const result = await bulkCreate([], mockTransaction);

      expect(result).toEqual([]);
      expect(db.UserSetting.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('insert', () => {
    it('should call create on UserSetting table and return the result', async () => {
      db.UserSetting.create.mockResolvedValueOnce(data);

      const result = await insert(data, mockTransaction);

      expect(result).toEqual(data);
      expect(db.UserSetting.create).toHaveBeenCalledWith(data, {
        transaction: mockTransaction,
      });
    });
  });

  describe('getById', () => {
    it('should call findByPk on UserSetting table and return the result', async () => {
      db.UserSetting.findByPk.mockResolvedValueOnce({ toJSON: () => data });

      const result = await getById(userId);

      expect(result).toEqual(data);
      expect(db.UserSetting.findByPk).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should call update on UserSetting table', async () => {
      db.UserSetting.update.mockResolvedValueOnce([1, { ...data }]);
      const { id, ...dataWithoutId } = data;

      const result = await update(id, dataWithoutId, mockTransaction);

      expect(result).toEqual({ updateCount: 1, updatedData: data });
      expect(db.UserSetting.update).toHaveBeenCalledWith(dataWithoutId, {
        where: {
          id,
        },
        returning: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('delete', () => {
    it('should call destroy on UserSetting table and return deleted value', async () => {
      db.UserSetting.findByPk.mockResolvedValueOnce({
        toJSON: () => data,
      });
      db.UserSetting.destroy.mockResolvedValueOnce(1);

      const result = await deleteSetting(data.id, mockTransaction);

      expect(result).toEqual(data);
      expect(db.UserSetting.destroy).toHaveBeenCalledWith({
        where: { id: data.id },
        transaction: mockTransaction,
      });
    });

    it('should skip destroy when findByPk returns nothing', async () => {
      db.UserShareableInfo.findByPk.mockResolvedValueOnce(undefined);

      const result = await deleteSetting(uuid.v4());

      expect(result).toEqual(undefined);
      expect(db.UserSetting.destroy).not.toHaveBeenCalled();
    });
  });
});
