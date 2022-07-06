const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const { create, getAll } = require('../../dataAccess/v1/scrapedFailedUrl');

const db = require('../../index');

describe('Scraped Failed URL DAL', () => {
  const mockFailedUrl = {
    id: uuid.v4(),
    url: faker.internet.url(),
    error: faker.random.word(),
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
    it('should call create on ScrapedFailedUrl table', async () => {
      db.ScrapedFailedUrl.create.mockResolvedValueOnce(mockFailedUrl);
      const result = await create(mockFailedUrl, mockTransaction);

      expect(result).toEqual(mockFailedUrl);
      expect(db.ScrapedFailedUrl.create).toHaveBeenCalledWith(mockFailedUrl, {
        validate: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('getAll', () => {
    it('should call findAll on ScrapedFailedUrl table', async () => {
      const mockUrls = Array(2)
        .fill()
        .map(() => {
          return { url: faker.internet.url(), error: 'Error' };
        });
      db.ScrapedFailedUrl.findAll.mockResolvedValueOnce(mockUrls);
      const source = 'SAP';
      const result = await getAll(source);

      expect(result).toEqual(mockUrls);
      expect(db.ScrapedFailedUrl.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining(['url', 'error']),
        raw: true,
        where: {
          source,
        },
      });
    });
  });
});
