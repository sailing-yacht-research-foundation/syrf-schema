const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  bulkCreate,
  getByCompetition,
} = require('../../dataAccess/v1/vesselParticipantEvent');

const db = require('../../index');
const { vesselEvents } = require('../../enums');

describe('Vessel Participant Event', () => {
  const mockTransaction = db.sequelize.transaction();
  const vesselEvent = {
    id: uuid.v4(),
    competitionUnitId: uuid.v4(),
    vesselParticipantId: uuid.v4(),
    markId: uuid.v4(),
    eventType: vesselEvents.insideCrossing,
    eventTime: new Date(),
    eventCoordinate: {
      crs: { type: 'name', properties: [] },
      type: 'Point',
      coordinates: [
        Number(faker.address.longitude()),
        Number(faker.address.latitude),
      ],
    },
    isRecalculated: false,
  };
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on VesselParticipantEvent table if provided with valid data', async () => {
      const data = [
        {
          ...vesselEvent,
        },
      ];
      db.VesselParticipantEvent.bulkCreate.mockResolvedValueOnce([...data]);

      const result = await bulkCreate(data, mockTransaction);

      expect(result).toEqual(data);
      expect(db.VesselParticipantEvent.bulkCreate).toHaveBeenCalledWith(data, {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      });
    });
    it('should not call bulkCreate on VesselParticipantEvent table if provided with empty array', async () => {
      const result = await bulkCreate([], mockTransaction);

      expect(result).toEqual([]);
      expect(db.VesselParticipantEvent.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('getByCompetition', () => {
    it('should pass params to where condition of findAll', async () => {
      const competitionUnitId = uuid.v4();
      const eventType = vesselEvents.insideCrossing;
      db.VesselParticipantEvent.findAll.mockResolvedValueOnce([vesselEvent]);

      const result = await getByCompetition({
        competitionUnitId,
        eventType,
      });

      expect(db.VesselParticipantEvent.findAll).toHaveBeenCalledWith({
        where: { competitionUnitId, eventType },
      });
      expect(result).toEqual([vesselEvent]);
    });
    it('should exclude eventType condition if not provided', async () => {
      const competitionUnitId = uuid.v4();
      db.VesselParticipantEvent.findAll.mockResolvedValueOnce([vesselEvent]);

      const result = await getByCompetition({
        competitionUnitId,
      });

      expect(db.VesselParticipantEvent.findAll).toHaveBeenCalledWith({
        where: { competitionUnitId },
      });
      expect(result).toEqual([vesselEvent]);
    });
  });
});
