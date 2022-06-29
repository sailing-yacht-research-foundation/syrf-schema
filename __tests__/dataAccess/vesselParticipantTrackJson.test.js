const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  bulkCreate,
  getByCompetitionAndVP,
} = require('../../dataAccess/v1/vesselParticipantTrackJson');

const db = require('../../index');

describe('Vessel Participant Track Json', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on VesselParticipantTrackJson table if provided with valid data', async () => {
      const data = [
        {
          id: uuid.v4(),
          competitionUnitId: uuid.v4(),
          vesselParticipantId: uuid.v4(),
          providedStorageKey: 'path/to/file.geojson',
          calculatedStorageKey: 'path/to/file.geojson',
          simplifiedStorageKey: 'path/to/file.geojson',
          totalTraveledDistance: 10,
          firstPosition: {
            crs: { type: 'name', properties: [] },
            type: 'Point',
            coordinates: [
              Number(faker.address.longitude()),
              Number(faker.address.latitude),
            ],
          },
          locationUpdateCount: 10,
        },
      ];
      db.VesselParticipantTrackJson.bulkCreate.mockResolvedValueOnce([...data]);
      const mockTransaction = db.sequelize.transaction();

      const result = await bulkCreate(data, mockTransaction);

      expect(result).toEqual(data);
      expect(db.VesselParticipantTrackJson.bulkCreate).toHaveBeenCalledWith(
        data,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction: mockTransaction,
        },
      );
    });

    it('should not call bulkCreate on VesselParticipantTrackJson table if provided with empty array', async () => {
      const mockTransaction = db.sequelize.transaction();

      const result = await bulkCreate([], mockTransaction);

      expect(result).toEqual([]);
      expect(db.VesselParticipantTrackJson.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('getByCompetitionAndVP', () => {
    it('should pass params to where condition of findOne', async () => {
      const competitionUnitId = uuid.v4();
      const vesselParticipantId = uuid.v4();
      const trackJson = {
        id: uuid.v4(),
        competitionUnitId,
        vesselParticipantId,
        providedStorageKey: 'path/to/file.geojson',
        calculatedStorageKey: 'path/to/file.geojson',
        simplifiedStorageKey: 'path/to/file.geojson',
        totalTraveledDistance: 10,
        firstPosition: {
          crs: { type: 'name', properties: [] },
          type: 'Point',
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude),
          ],
        },
        locationUpdateCount: 10,
      };
      const mockTrackJson = {
        ...trackJson,
        toJSON: jest.fn(() => {
          return trackJson;
        }),
      };
      db.VesselParticipantTrackJson.findOne.mockResolvedValueOnce(
        mockTrackJson,
      );

      const result = await getByCompetitionAndVP(
        competitionUnitId,
        vesselParticipantId,
      );

      expect(mockTrackJson.toJSON).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantTrackJson.findOne).toHaveBeenCalledWith({
        where: { competitionUnitId, vesselParticipantId },
        include: [
          expect.objectContaining({
            as: 'vesselParticipant',
            attributes: ['vesselParticipantGroupId'],
          }),
        ],
      });
      expect(result).toEqual(trackJson);
    });
  });
});
