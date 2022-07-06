const uuid = require('uuid');

const {
  bulkInsert,
  findExistingSlices,
  findByCompetition,
} = require('../../dataAccess/v1/slicedWeather');

const db = require('../../index');

describe('Sliced Weather DAL', () => {
  const mockSlicedWeather = {
    id: uuid.v4(),
    model: 'GFS',
    startTime: new Date(),
    endTime: new Date(),
    s3Key: 'path/to/file',
    fileType: 'JSON',
    boundingBox: {
      crs: {
        type: 'name',
        properties: {
          name: 'EPSG:4326',
        },
      },
      type: 'Polygon',
      coordinates: [
        [
          [4, 4],
          [4, 5],
          [5, 5],
          [5, 4],
          [4, 4],
        ],
      ],
    },
    levels: ['10m above ground'],
    runtimes: [new Date()],
    variables: ['UGUST', 'VGUST'],
    competitionUnitId: uuid.v4(),
    originalFileId: uuid.v4(),
    sliceDate: new Date(),
  };
  const mockTransaction = db.sequelize.transaction();
  beforeAll(() => {
    db.SlicedWeather.findAll.mockResolvedValue([mockSlicedWeather]);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
    db.SlicedWeather.findAll.mockReset();
  });

  describe('bulkInsert', () => {
    it('should call bulkCreate on SlicedWeather table', async () => {
      db.SlicedWeather.bulkCreate.mockResolvedValueOnce([mockSlicedWeather]);
      const result = await bulkInsert([mockSlicedWeather], mockTransaction);

      expect(result).toEqual([mockSlicedWeather]);
      expect(db.SlicedWeather.bulkCreate).toHaveBeenCalledWith(
        [mockSlicedWeather],
        {
          ignoreDuplicates: true,
          validate: true,
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('findExistingSlices', () => {
    it('should call findAll on SlicedWeather table', async () => {
      const competitionUnitId = uuid.v4();
      const originalFileId = uuid.v4();
      const result = await findExistingSlices({
        competitionUnitId,
        originalFileId,
      });

      expect(result).toEqual([mockSlicedWeather]);
      expect(db.SlicedWeather.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
          originalFileId,
        },
      });
    });
  });

  describe('findByCompetition', () => {
    it('should call findAll on SlicedWeather table', async () => {
      const competitionUnitId = uuid.v4();
      const result = await findByCompetition(competitionUnitId);

      expect(result).toEqual([mockSlicedWeather]);
      expect(db.SlicedWeather.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
        },
        raw: true,
      });
    });
  });
});
