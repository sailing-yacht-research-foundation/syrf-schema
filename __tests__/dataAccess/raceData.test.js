const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  getLegsByCompetitionUnit,
  getEventsByCompetitionUnit,
  getCompetitionUnitResult,
  getLegsByVesselParticipant,
  getEventsByVesselParticipant,
  getJsonTracksByVP,
  getJsonTracksByCU,
  getVPTrackJsonsByRaceId,
  getPointTrackJsonsByRaceId,
} = require('../../dataAccess/v1/raceData');

const db = require('../../index');
const { vesselEvents } = require('../../enums');

describe('Race Data DAL', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getLegsByCompetitionUnit', () => {
    const mockLegs = Array(5)
      .fill()
      .map(() => {
        return {
          vesselParticipantId: uuid.v4(),
          legId: uuid.v4(),
          startTime: new Date(),
          stopTime: new Date(),
          averageCourseDerivedTWA: faker.datatype.number({ max: 360 }),
          averageCourseTWA: faker.datatype.number({ max: 360 }),
          legDistance: faker.datatype.number({ max: 10 }),
          elapsedTime: 1000,
          startPoint: {
            crs: { type: 'name', properties: [] },
            type: 'Point',
            coordinates: [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
          },
          endPoint: {
            crs: { type: 'name', properties: [] },
            type: 'Point',
            coordinates: [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
          },
          traveledDistance: faker.datatype.number({ max: 20 }),
          isRecalculated: false,
        };
      });
    beforeAll(() => {
      db.VesselParticipantLeg.findAll.mockResolvedValue(mockLegs);
    });
    afterAll(() => {
      db.VesselParticipantLeg.findAll.mockReset();
    });
    it('should findAll on VesselParticipantLeg, without startTime in where condition if not provided time range', async () => {
      const competitionUnitId = uuid.v4();
      const result = await getLegsByCompetitionUnit(competitionUnitId);

      expect(result).toEqual(mockLegs);
      expect(db.VesselParticipantLeg.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            competitionUnitId,
          },
          order: expect.arrayContaining([
            ['vesselParticipantId', 'ASC'],
            ['startTime', 'ASC'],
          ]),
          raw: true,
        }),
      );
    });
    it('should findAll on VesselParticipantLeg within the provided time range', async () => {
      const competitionUnitId = uuid.v4();
      const timeFrom = new Date();
      const timeTo = new Date();
      const result = await getLegsByCompetitionUnit(
        competitionUnitId,
        timeFrom,
        timeTo,
      );

      expect(result).toEqual(mockLegs);
      expect(db.VesselParticipantLeg.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            competitionUnitId,
            startTime: {
              [db.Op.between]: [timeFrom, timeTo],
            },
          },
        }),
      );
    });
    it('should not call to DB and return null when provided with falsy id', async () => {
      const result = await getLegsByCompetitionUnit('');

      expect(result).toEqual(null);
      expect(db.VesselParticipantLeg.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getEventsByCompetitionUnit', () => {
    const mockEvents = Array(5)
      .fill()
      .map(() => {
        return {
          vesselParticipantId: uuid.v4(),
          markId: uuid.v4(),
          eventType: vesselEvents.insideCrossing,
          eventTime: new Date(),
          eventCoordinate: {
            crs: { type: 'name', properties: [] },
            type: 'Point',
            coordinates: [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
          },
          isRecalculated: false,
        };
      });
    beforeAll(() => {
      db.VesselParticipantEvent.findAll.mockResolvedValue(mockEvents);
    });
    afterAll(() => {
      db.VesselParticipantEvent.findAll.mockReset();
    });
    it('should findAll on VesselParticipantEvent, without eventTime in where condition if not provided time range', async () => {
      const competitionUnitId = uuid.v4();
      const result = await getEventsByCompetitionUnit(competitionUnitId);

      expect(result).toEqual(mockEvents);
      expect(db.VesselParticipantEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            competitionUnitId,
          },
          order: expect.arrayContaining([
            ['vesselParticipantId', 'ASC'],
            ['eventTime', 'ASC'],
          ]),
          raw: true,
        }),
      );
    });
    it('should findAll on VesselParticipantEvent within the provided time range', async () => {
      const competitionUnitId = uuid.v4();
      const timeFrom = new Date();
      const timeTo = new Date();
      const result = await getEventsByCompetitionUnit(
        competitionUnitId,
        timeFrom,
        timeTo,
      );

      expect(result).toEqual(mockEvents);
      expect(db.VesselParticipantEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            competitionUnitId,
            eventTime: {
              [db.Op.between]: [timeFrom, timeTo],
            },
          },
        }),
      );
    });
    it('should not call to DB and return null when provided with falsy id', async () => {
      const result = await getEventsByCompetitionUnit('');

      expect(result).toEqual(null);
      expect(db.VesselParticipantEvent.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getCompetitionUnitResult', () => {
    it('should findAll Competition Result ordered by the rank ascending', async () => {
      const mockResults = Array(5)
        .fill()
        .map((_row, index) => {
          return {
            vesselParticipantId: uuid.v4(),
            finishTime: new Date(),
            time: faker.datatype.number({ min: 100, max: 10000 }),
            rank: index + 1,
            isRecalculated: false,
          };
        });
      db.CompetitionResult.findAll.mockResolvedValueOnce(mockResults);
      const competitionUnitId = uuid.v4();

      const result = await getCompetitionUnitResult(competitionUnitId);

      expect(result).toEqual(mockResults);
      expect(db.CompetitionResult.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            competitionUnitId,
          },
          order: [['rank', 'ASC']],
          raw: true,
        }),
      );
    });
    it('should not call to DB and return null when provided with falsy id', async () => {
      const result = await getCompetitionUnitResult('');

      expect(result).toEqual(null);
      expect(db.CompetitionResult.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getLegsByVesselParticipant', () => {
    const mockLegs = [
      {
        legId: uuid.v4(),
        startTime: new Date(),
        stopTime: new Date(),
        averageCourseDerivedTWA: faker.datatype.number({ max: 360 }),
        averageCourseTWA: faker.datatype.number({ max: 360 }),
        legDistance: faker.datatype.number({ max: 10 }),
        elapsedTime: 1000,
        startPoint: {
          crs: { type: 'name', properties: [] },
          type: 'Point',
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
        },
        endPoint: {
          crs: { type: 'name', properties: [] },
          type: 'Point',
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
        },
        traveledDistance: faker.datatype.number({ max: 20 }),
        isRecalculated: false,
      },
    ];
    beforeAll(() => {
      db.VesselParticipantLeg.findAll.mockResolvedValue(mockLegs);
    });
    afterAll(() => {
      db.VesselParticipantLeg.findAll.mockReset();
    });
    it('should findAll on VesselParticipantLeg, without startTime in where condition if not provided time range', async () => {
      const vesselParticipantId = uuid.v4();
      const result = await getLegsByVesselParticipant(vesselParticipantId);

      expect(result).toEqual(mockLegs);
      expect(db.VesselParticipantLeg.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vesselParticipantId,
          },
          order: expect.arrayContaining([['startTime', 'ASC']]),
          raw: true,
        }),
      );
    });
    it('should findAll on VesselParticipantLeg within the provided time range', async () => {
      const vesselParticipantId = uuid.v4();
      const timeFrom = new Date();
      const timeTo = new Date();
      const result = await getLegsByVesselParticipant(
        vesselParticipantId,
        timeFrom,
        timeTo,
      );

      expect(result).toEqual(mockLegs);
      expect(db.VesselParticipantLeg.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vesselParticipantId,
            startTime: {
              [db.Op.between]: [timeFrom, timeTo],
            },
          },
        }),
      );
    });
    it('should not call to DB and return null when provided with falsy id', async () => {
      const result = await getLegsByVesselParticipant('');

      expect(result).toEqual(null);
      expect(db.VesselParticipantLeg.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getEventsByVesselParticipant', () => {
    const mockEvents = [
      {
        markId: uuid.v4(),
        eventType: vesselEvents.insideCrossing,
        eventTime: new Date(),
        eventCoordinate: {
          crs: { type: 'name', properties: [] },
          type: 'Point',
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
        },
        isRecalculated: false,
      },
    ];
    beforeAll(() => {
      db.VesselParticipantEvent.findAll.mockResolvedValue(mockEvents);
    });
    afterAll(() => {
      db.VesselParticipantEvent.findAll.mockReset();
    });
    it('should findAll on VesselParticipantEvent, without eventTime in where condition if not provided time range', async () => {
      const vesselParticipantId = uuid.v4();
      const result = await getEventsByVesselParticipant(vesselParticipantId);

      expect(result).toEqual(mockEvents);
      expect(db.VesselParticipantEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vesselParticipantId,
          },
          order: expect.arrayContaining([['eventTime', 'ASC']]),
          raw: true,
        }),
      );
    });
    it('should findAll on VesselParticipantEvent within the provided time range', async () => {
      const vesselParticipantId = uuid.v4();
      const timeFrom = new Date();
      const timeTo = new Date();
      const result = await getEventsByVesselParticipant(
        vesselParticipantId,
        timeFrom,
        timeTo,
      );

      expect(result).toEqual(mockEvents);
      expect(db.VesselParticipantEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vesselParticipantId,
            eventTime: {
              [db.Op.between]: [timeFrom, timeTo],
            },
          },
        }),
      );
    });
    it('should not call to DB and return null when provided with falsy id', async () => {
      const result = await getEventsByVesselParticipant('');

      expect(result).toEqual(null);
      expect(db.VesselParticipantEvent.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getJsonTracksByVP', () => {
    it('should findOne on VesselParticipantTrackJson using vp id and return the value', async () => {
      const mockTrackJson = {
        id: uuid.v4(),
        competitionUnitId: uuid.v4(),
        vesselParticipantId: uuid.v4(),
        providedStorageKey: 'path/to/provided',
        calculatedStorageKey: 'path/to/calculated',
        simplifiedStorageKey: 'path/to/simplified',
        totalTraveledDistance: faker.datatype.number({
          min: 1,
          max: 10,
          precision: 0.01,
        }),
        firstPosition: {
          crs: { type: 'name', properties: [] },
          type: 'Point',
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
        },
        locationUpdateCount: faker.datatype.number({
          min: 10,
          max: 100,
        }),
      };
      db.VesselParticipantTrackJson.findOne.mockResolvedValueOnce({
        toJSON: () => mockTrackJson,
      });

      const result = await getJsonTracksByVP(mockTrackJson.vesselParticipantId);

      expect(result).toEqual(mockTrackJson);
      expect(db.VesselParticipantTrackJson.findOne).toHaveBeenCalledWith({
        where: {
          vesselParticipantId: mockTrackJson.vesselParticipantId,
        },
      });
    });
    it('should not call to DB and return null when provided with falsy id', async () => {
      const result = await getJsonTracksByVP('');

      expect(result).toEqual(null);
      expect(db.VesselParticipantTrackJson.findOne).not.toHaveBeenCalled();
    });
  });

  describe('getJsonTracksByCU', () => {
    it('should findAll on VesselParticipantTrackJson using competition id and return the value', async () => {
      const mockTrackJson = {
        id: uuid.v4(),
        competitionUnitId: uuid.v4(),
        vesselParticipantId: uuid.v4(),
        providedStorageKey: 'path/to/provided',
        calculatedStorageKey: 'path/to/calculated',
        simplifiedStorageKey: 'path/to/simplified',
        totalTraveledDistance: faker.datatype.number({
          min: 1,
          max: 10,
          precision: 0.01,
        }),
        firstPosition: {
          crs: { type: 'name', properties: [] },
          type: 'Point',
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
        },
        locationUpdateCount: faker.datatype.number({
          min: 10,
          max: 100,
        }),
      };
      db.VesselParticipantTrackJson.findAll.mockResolvedValueOnce([
        mockTrackJson,
      ]);

      const result = await getJsonTracksByCU(mockTrackJson.competitionUnitId);

      expect(result).toEqual([mockTrackJson]);
      expect(db.VesselParticipantTrackJson.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId: mockTrackJson.competitionUnitId,
        },
        raw: true,
      });
    });
    it('should not call to DB and return null when provided with falsy id', async () => {
      const result = await getJsonTracksByCU('');

      expect(result).toEqual(null);
      expect(db.VesselParticipantTrackJson.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getVPTrackJsonsByRaceId', () => {
    // Note: This function is a duplicate of previous function
    it('should findAll on VesselParticipantTrackJson using competition id and return the value', async () => {
      db.VesselParticipantTrackJson.findAll.mockResolvedValueOnce([]);

      const competitionUnitId = uuid.v4();
      const result = await getVPTrackJsonsByRaceId(competitionUnitId);

      expect(result).toEqual([]);
      expect(db.VesselParticipantTrackJson.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
        },
        raw: true,
      });
    });
  });

  describe('getPointTrackJsonsByRaceId', () => {
    it('should findAll on CompetitionPointTrackJson using competition id and return the values', async () => {
      db.CompetitionPointTrackJson.findAll.mockResolvedValueOnce([]);

      const competitionUnitId = uuid.v4();
      const result = await getPointTrackJsonsByRaceId(competitionUnitId);

      expect(result).toEqual([]);
      expect(db.CompetitionPointTrackJson.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
        },
        raw: true,
      });
    });
  });
});
