const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  upsert,
  getById,
  delete: deleteStream,
  clear,
  validateParticipant,
  validateParticipantByCUId,
  setStartedStreamFlag,
} = require('../../dataAccess/v1/stream');

const db = require('../../index');

describe('Stream DAL', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('upsert', () => {
    it('should add streamData to the Map of streams', async () => {
      const streamData = {
        content: faker.random.words(3),
      };
      const sub = uuid.v4();
      const result = await upsert(sub, streamData);
      expect(result).toEqual(streamData);

      const assertion = await getById(sub);
      expect(assertion).toEqual(streamData);
    });
  });

  describe('getById', () => {
    it('should return value set on stream Map', async () => {
      const sub = uuid.v4();
      const data = await getById(sub);
      expect(data).toEqual(undefined);

      await upsert(sub, {
        content: faker.random.words(3),
      });

      const result = await getById(sub);
      expect(result).not.toEqual(undefined);
    });
  });

  describe('delete', () => {
    it('should remove data from stream Map based on the sub (id)', async () => {
      const sub = uuid.v4();
      await upsert(sub, {
        content: faker.random.words(3),
      });

      const result = await deleteStream(sub);
      expect(result).not.toEqual(undefined);
    });
  });

  describe('clear', () => {
    it('should remove all data from stream Map', async () => {
      const sub = uuid.v4();
      await upsert(sub);
      expect(await getById(sub)).not.toEqual(undefined);

      await clear();
      expect(await getById(sub)).toEqual(undefined);
    });
  });

  describe('validateParticipant', () => {
    it('should findOne a VesselParticipantCrew based on the vp & user id', async () => {
      const userId = uuid.v4();
      const vesselParticipantId = uuid.v4();
      const data = {
        id: uuid.v4(),
        vesselParticipantId,
        participantId: uuid.v4(),
        participant: { userProfileId: userId },
        vesselParticipant: {
          id: vesselParticipantId,
          group: {
            id: uuid.v4(),
          },
        },
      };
      db.VesselParticipantCrew.findOne.mockResolvedValueOnce({
        toJSON: () => data,
      });

      const result = await validateParticipant(userId, vesselParticipantId);

      expect(result).toEqual(data);
      expect(db.VesselParticipantCrew.findOne).toHaveBeenCalledWith({
        where: {
          vesselParticipantId,
          '$participant.userProfileId$': userId,
        },
        attributes: expect.arrayContaining([
          'id',
          'vesselParticipantId',
          'participantId',
        ]),
        subQuery: false,
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participant',
            where: {
              userProfileId: userId,
            },
          }),
          expect.objectContaining({
            as: 'vesselParticipant',
          }),
        ]),
      });
    });
  });

  describe('validateParticipantByCUId', () => {
    it('should findOne a VesselParticipantCrew based on the competition & user id', async () => {
      const userId = uuid.v4();
      const vesselParticipantId = uuid.v4();
      const competitionUnitId = uuid.v4();
      const data = {
        id: uuid.v4(),
        vesselParticipantId,
        participantId: uuid.v4(),
        participant: { userProfileId: userId, event: { id: uuid.v4() } },
        vesselParticipant: {
          id: vesselParticipantId,
          group: {
            id: uuid.v4(),
            competitionUnit: [{ id: competitionUnitId }],
          },
        },
      };
      db.VesselParticipantCrew.findOne.mockResolvedValueOnce({
        toJSON: () => data,
      });

      const result = await validateParticipantByCUId(userId, competitionUnitId);

      expect(result).toEqual(data);
      expect(db.VesselParticipantCrew.findOne).toHaveBeenCalledWith({
        attributes: expect.arrayContaining([
          'id',
          'vesselParticipantId',
          'participantId',
        ]),
        subQuery: false,
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participant',
            required: true,
            where: {
              userProfileId: userId,
            },
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'event',
              }),
            ]),
          }),
          expect.objectContaining({
            as: 'vesselParticipant',
            required: true,
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'group',
                required: true,
                include: expect.arrayContaining([
                  expect.objectContaining({
                    as: 'competitionUnit',
                    required: true,
                    where: {
                      id: competitionUnitId,
                    },
                  }),
                ]),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('setStartedStreamFlag', () => {
    it('should call update on VesselParticipantCrew and set startedStream as true', async () => {
      const crewId = uuid.v4();
      await setStartedStreamFlag(crewId);

      expect(db.VesselParticipantCrew.update).toHaveBeenCalledWith(
        {
          startedStream: true,
        },
        {
          where: {
            id: crewId,
          },
        },
      );
    });
  });
});
