const uuid = require('uuid');

const {
  bulkInsert,
  findExistingSlices,
  findByCompetition,
  findById,
  findWithPaging,
} = require('../../dataAccess/v1/slicedWeather');
const { slicedWeatherTypes, weatherModels } = require('../../enums');

const db = require('../../index');

describe('Sliced Weather DAL', () => {
  const mockSlicedWeather = {
    id: uuid.v4(),
    model: 'GFS',
    startTime: new Date(),
    endTime: new Date(),
    s3Key: 'path/to/file',
    fileType: slicedWeatherTypes.JSON,
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
    db.SlicedWeather.findByPk.mockResolvedValue({
      toJSON: () => mockSlicedWeather,
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
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
    it('should have fileType on where condition if provided', async () => {
      const competitionUnitId = uuid.v4();
      const originalFileId = uuid.v4();
      const result = await findExistingSlices({
        competitionUnitId,
        originalFileId,
        fileType: 'GRIB',
      });

      expect(result).toEqual([mockSlicedWeather]);
      expect(db.SlicedWeather.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
          originalFileId,
          fileType: 'GRIB',
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
    it('should call findAll on SlicedWeather table with specified file type', async () => {
      const competitionUnitId = uuid.v4();
      const result = await findByCompetition(
        competitionUnitId,
        slicedWeatherTypes.JSON,
      );

      expect(result).toEqual([mockSlicedWeather]);
      expect(db.SlicedWeather.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
          fileType: slicedWeatherTypes.JSON,
        },
        raw: true,
      });
    });
  });

  describe('findById', () => {
    it('should call findByPk on SlicedWeather table', async () => {
      const id = uuid.v4();
      const result = await findById(id);

      expect(result).toEqual(mockSlicedWeather);
      expect(db.SlicedWeather.findByPk).toHaveBeenCalledWith(id, {
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'competitionUnit',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'calendarEvent',
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('findWithPaging', () => {
    it('should call findAllWithPaging on SlicedWeather table', async () => {
      const paging = { page: 1, size: 10 };
      const competitionUnitId = uuid.v4();

      await findWithPaging(paging, { competitionUnitId });

      expect(db.SlicedWeather.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: { competitionUnitId },
        },
        { ...paging, defaultSort: [['sliceDate', 'DESC']] },
      );
    });
    it('should add fileType and model as where condition if provided', async () => {
      const paging = { page: 1, size: 10 };
      const competitionUnitId = uuid.v4();
      const fileType = slicedWeatherTypes.GRIB;
      const model = weatherModels.GFS;

      await findWithPaging(paging, {
        competitionUnitId,
        fileType,
        model,
      });

      expect(db.SlicedWeather.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            competitionUnitId,
            fileType,
            model: {
              [db.Op.in]: model,
            },
          },
        },
        { ...paging, defaultSort: [['sliceDate', 'DESC']] },
      );
    });
  });
});
