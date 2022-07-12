const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  getAll,
  getById,
  getByBothUserId,
  insert,
  update,
  delete: deleteCredential,
} = require('../../dataAccess/v1/externalServiceCredentials');
const { externalServiceSources } = require('../../enums');

const db = require('../../index');

describe('External Service Credentials', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getAll', () => {
    it('should query by userProfileId and source if provided', async () => {
      const paging = { page: 1, size: 10 };
      const userProfileId = uuid.v4();
      const source = externalServiceSources.yachtscoring;

      await getAll(paging, userProfileId, source);

      expect(
        db.ExternalServiceCredential.findAllWithPaging,
      ).toHaveBeenCalledWith(
        {
          attributes: {
            exclude: expect.arrayContaining(['password']),
          },
          where: {
            userProfileId,
            source,
          },
        },
        paging,
      );
    });
    it('should query by userProfileId if source is not provided', async () => {
      const paging = { page: 1, size: 10 };
      const userProfileId = uuid.v4();

      await getAll(paging, userProfileId);

      expect(
        db.ExternalServiceCredential.findAllWithPaging,
      ).toHaveBeenCalledWith(
        {
          attributes: {
            exclude: expect.arrayContaining(['password']),
          },
          where: {
            userProfileId,
          },
        },
        paging,
      );
    });
  });

  describe('getById', () => {
    it('should findByPk on ExternalServiceCredential', async () => {
      const credential = {
        id: uuid.v4(),
        userProfileId: uuid.v4(),
        source: externalServiceSources.yachtscoring,
        userId: `${faker.random.word()}${faker.random.numeric(2)}`,
        password: 'encryptedval',
      };
      db.ExternalServiceCredential.findByPk.mockResolvedValueOnce({
        toJSON: () => credential,
      });

      const result = await getById(credential.id);

      expect(result).toEqual(credential);
      expect(db.ExternalServiceCredential.findByPk).toHaveBeenCalledWith(
        credential.id,
      );
    });
  });

  describe('getByBothUserId', () => {
    it('should findOne on ExternalServiceCredential using syrf user id, and the service user id', async () => {
      const credential = {
        id: uuid.v4(),
        userProfileId: uuid.v4(),
        source: externalServiceSources.yachtscoring,
        userId: `${faker.random.word()}${faker.random.numeric(2)}`,
        password: 'encryptedval',
      };
      db.ExternalServiceCredential.findOne.mockResolvedValueOnce({
        toJSON: () => credential,
      });

      const result = await getByBothUserId(
        credential.userId,
        credential.userProfileId,
      );

      expect(result).toEqual(credential);
      expect(db.ExternalServiceCredential.findOne).toHaveBeenCalledWith({
        where: {
          userId: credential.userId,
          userProfileId: credential.userProfileId,
        },
      });
    });
  });

  describe('insert', () => {
    it('should create ExternalServiceCredential with the provided data', async () => {
      const mockCredential = {
        userId: `${faker.random.word()}${faker.random.numeric(2)}`,
        password: 'encryptedval',
        source: externalServiceSources.yachtscoring,
        userProfileId: uuid.v4(),
      };
      db.ExternalServiceCredential.create.mockResolvedValueOnce({
        id: uuid.v4(),
        ...mockCredential,
      });

      const result = await insert(mockCredential, mockTransaction);

      expect(result).toEqual({
        ...mockCredential,
        id: expect.any(String),
      });
      expect(db.ExternalServiceCredential.create).toHaveBeenCalledWith(
        {
          userId: mockCredential.userId,
          password: mockCredential.password,
          source: mockCredential.source,
          userProfileId: mockCredential.userProfileId,
        },
        { transaction: mockTransaction },
      );
    });

    it('should set options as undefined if not provided with transaction', async () => {
      const mockCredential = {
        userId: `${faker.random.word()}${faker.random.numeric(2)}`,
        password: 'encryptedval',
        source: externalServiceSources.yachtscoring,
        userProfileId: uuid.v4(),
      };
      db.ExternalServiceCredential.create.mockResolvedValueOnce({
        id: uuid.v4(),
        ...mockCredential,
      });

      await insert(mockCredential);
      expect(db.ExternalServiceCredential.create).toHaveBeenCalledWith(
        {
          userId: mockCredential.userId,
          password: mockCredential.password,
          source: mockCredential.source,
          userProfileId: mockCredential.userProfileId,
        },
        undefined,
      );
    });
  });

  describe('update', () => {
    it('should call update on ExternalServiceCredential', async () => {
      const data = {
        userId: `${faker.random.word()}${faker.random.numeric(2)}`,
        password: 'encryptedval',
        source: externalServiceSources.yachtscoring,
        userProfileId: uuid.v4(),
      };
      const id = uuid.v4();
      db.ExternalServiceCredential.update.mockResolvedValueOnce([1, undefined]);

      const result = await update(id, data, mockTransaction);

      expect(result).toEqual(1);
      expect(db.ExternalServiceCredential.update).toHaveBeenCalledWith(data, {
        where: { id },
        transaction: mockTransaction,
      });
    });
  });

  describe('delete', () => {
    it('should call destroy on ExternalServiceCredential', async () => {
      const id = uuid.v4();
      const userProfileId = uuid.v4();
      db.ExternalServiceCredential.destroy.mockResolvedValueOnce(1);

      const result = await deleteCredential(id, userProfileId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.ExternalServiceCredential.destroy).toHaveBeenCalledWith({
        where: { id, userProfileId },
        transaction: mockTransaction,
      });
    });
  });
});
