const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  create,
  getAll,
  deleteByOriginalId,
  deleteByUrl,
} = require('../../dataAccess/v1/scrapedSuccessfulUrl');

const db = require('../../index');

describe('Scraped Successful URL DAL', () => {
  const mockSuccessUrl = {
    id: uuid.v4(),
    url: faker.internet.url(),
    originalId: uuid.v4(),
    source: 'SAP',
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
    it('should call create on ScrapedSuccessfulUrl table', async () => {
      db.ScrapedSuccessfulUrl.create.mockResolvedValueOnce(mockSuccessUrl);
      const result = await create(mockSuccessUrl, mockTransaction);

      expect(result).toEqual(mockSuccessUrl);
      expect(db.ScrapedSuccessfulUrl.create).toHaveBeenCalledWith(
        mockSuccessUrl,
        {
          validate: true,
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('getAll', () => {
    it('should call findAll on ScrapedSuccessfulUrl table', async () => {
      const mockUrls = Array(5)
        .fill()
        .map(() => {
          return { url: faker.internet.url(), originalId: uuid.v4() };
        });
      db.ScrapedSuccessfulUrl.findAll.mockResolvedValueOnce(mockUrls);
      const source = 'SAP';
      const result = await getAll(source);

      expect(result).toEqual(mockUrls);
      expect(db.ScrapedSuccessfulUrl.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining([
          db.Sequelize.literal('DISTINCT url'),
          'originalId',
        ]),
        raw: true,
        where: {
          source,
        },
      });
    });
  });

  describe('deleteByOriginalId', () => {
    it('should call destroy on ScrapedSuccessfulUrl table', async () => {
      db.ScrapedSuccessfulUrl.destroy.mockResolvedValueOnce(1);
      await deleteByOriginalId(
        {
          source: mockSuccessUrl.source,
          originalId: mockSuccessUrl.originalId,
        },
        mockTransaction,
      );

      expect(db.ScrapedSuccessfulUrl.destroy).toHaveBeenCalledWith({
        where: {
          originalId: {
            [db.Op.eq]: mockSuccessUrl.originalId,
          },
          source: {
            [db.Op.eq]: mockSuccessUrl.source,
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('deleteByUrl', () => {
    it('should call destroy on ScrapedSuccessfulUrl table', async () => {
      db.ScrapedSuccessfulUrl.destroy.mockResolvedValueOnce(1);
      await deleteByUrl(mockSuccessUrl.url, mockTransaction);

      expect(db.ScrapedSuccessfulUrl.destroy).toHaveBeenCalledWith({
        where: {
          url: mockSuccessUrl.url,
        },
        transaction: mockTransaction,
      });
    });
  });
});
