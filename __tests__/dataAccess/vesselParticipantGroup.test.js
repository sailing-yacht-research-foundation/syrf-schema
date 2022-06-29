const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  upsert,
  getAll,
  getById,
  getByIds,
  getByCompetitionId,
  delete: deleteVPG,
  clear,
  getUnregisteredVessel,
  getUnregisteredParticipants,
  getParticipants,
  getParticipantByEvents,
} = require('../../dataAccess/v1/vesselParticipantGroup');

const db = require('../../index');
const { emptyPagingResponse } = require('../../utils/utils');
const { participantInvitationStatus } = require('../../enums');

describe('Vessel Participant Group', () => {
  const mockTransaction = db.sequelize.transaction();
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'competitionUnit',
      attributes: expect.arrayContaining(['id', 'name']),
    }),
    expect.objectContaining({
      as: 'vesselParticipants',
      attributes: expect.arrayContaining(['id', 'vesselParticipantId']),
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'vessel',
          attributes: expect.arrayContaining(['id', 'publicName']),
          paranoid: false,
        }),
      ]),
    }),
    expect.objectContaining({
      as: 'event',
      attributes: expect.arrayContaining(['id', 'name', 'isOpen']),
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'editors',
          attributes: ['id', 'name'],
        }),
        expect.objectContaining({
          as: 'owner',
          attributes: ['id', 'name'],
        }),
      ]),
    }),
  ]);
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('upsert', () => {
    beforeAll(() => {
      db.VesselParticipantGroup.upsert.mockImplementation(
        async (detail, _transaction) => {
          return [
            {
              toJSON: () => {
                return { ...detail };
              },
            },
            true,
          ];
        },
      );
    });
    afterAll(() => {
      db.VesselParticipantGroup.upsert.mockReset();
    });
    it('should call upsert on VesselParticipantGroup table and generate random uuid when not provided', async () => {
      const data = {
        vesselParticipantGroupId: uuid.v4(),
        name: `Class of ${faker.random.word()}`,
        calendarEventId: uuid.v4(),
      };

      const result = await upsert(null, data, mockTransaction);

      expect(result).toEqual({
        id: expect.any(String),
        ...data,
      });
      expect(db.VesselParticipantGroup.upsert).toHaveBeenCalledWith(
        {
          id: expect.any(String),
          ...data,
        },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on VesselParticipantGroup table and use the provided uuid', async () => {
      const groupId = uuid.v4();
      const data = {
        vesselParticipantGroupId: uuid.v4(),
        name: `Class of ${faker.random.word()}`,
        calendarEventId: uuid.v4(),
      };

      const result = await upsert(groupId, data, mockTransaction);

      expect(result).toEqual({ id: groupId, ...data });
      expect(db.VesselParticipantGroup.upsert).toHaveBeenCalledWith(
        { id: groupId, ...data },
        {
          transaction: mockTransaction,
        },
      );
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const groupId = uuid.v4();

      const result = await upsert(groupId);

      expect(result).toEqual({ id: groupId });
      expect(db.VesselParticipantGroup.upsert).toHaveBeenCalledWith(
        { id: groupId },
        {
          transaction: undefined,
        },
      );
    });
  });

  describe('getAll', () => {
    const mockAllVPG = {
      count: 1,
      rows: [
        {
          id: uuid.v4(),
          vesselParticipantGroupId: uuid.v4(),
          name: `Class of ${faker.random.word()}`,
          calendarEventId: uuid.v4(),
        },
      ],
      page: 1,
      size: 10,
      sort: 'updatedAt',
      srdir: 'DESC',
      q: '',
      filters: [],
    };
    const paging = {
      page: 1,
      size: 10,
    };
    const expectedInclude = expect.arrayContaining([
      expect.objectContaining({
        as: 'competitionUnit',
        attributes: expect.arrayContaining(['id', 'name']),
      }),
    ]);
    beforeAll(() => {
      // All the test will actually be asserted based on the function calls signature, not the return values
      // Result assertions is there to just make sure the function return what sequelize return, which is mocked
      db.VesselParticipantGroup.findAllWithPaging.mockResolvedValue(mockAllVPG);
    });
    afterAll(() => {
      db.VesselParticipantGroup.findAllWithPaging.mockReset();
    });
    it('should return all vpg of an event if provided with calendar event id', async () => {
      const calendarEventId = uuid.v4();

      const result = await getAll(paging, { calendarEventId });

      expect(result).toEqual(mockAllVPG);
      expect(db.VesselParticipantGroup.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: { calendarEventId },
          include: expectedInclude,
        },
        paging,
      );
    });
    it('should return all vpg of a user if not provided with calendar event id, and have user id', async () => {
      const userId = uuid.v4();

      const result = await getAll(paging, { userId });

      expect(result).toEqual(mockAllVPG);
      expect(db.VesselParticipantGroup.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: { createdById: userId },
          include: expectedInclude,
        },
        paging,
      );
    });
    it('should not fetch to DB and return empty response if not provided with anything', async () => {
      const result = await getAll(paging);

      expect(result).toEqual(emptyPagingResponse(paging));
      expect(
        db.VesselParticipantGroup.findAllWithPaging,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should call findByPk on VesselParticipantGroup with default include', async () => {
      const groupId = uuid.v4();
      const data = {
        id: groupId,
        vesselParticipantGroupId: uuid.v4(),
        name: `Class of ${faker.random.word()}`,
        calendarEventId: uuid.v4(),
      };
      db.VesselParticipantGroup.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return data;
        },
      });
      const result = await getById(groupId);

      expect(result).toEqual(data);
      expect(db.VesselParticipantGroup.findByPk).toHaveBeenCalledWith(groupId, {
        include: defaultIncludeExpectation,
        transaction: undefined,
      });
    });
  });

  describe('getByIds', () => {
    it('should call findAll on VesselParticipantGroup with raw option', async () => {
      const groupIds = Array(5)
        .fill()
        .map(() => uuid.v4());
      const mockGroupReturn = groupIds.map((id) => {
        return {
          id,
          vesselParticipantGroupId: uuid.v4(),
          name: `Class of ${faker.random.word()}`,
          calendarEventId: uuid.v4(),
        };
      });
      db.VesselParticipantGroup.findAll.mockResolvedValueOnce(mockGroupReturn);

      const result = await getByIds(groupIds);

      expect(result).toEqual(mockGroupReturn);
      expect(db.VesselParticipantGroup.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: groupIds,
          },
        },
        raw: true,
        transaction: undefined,
      });
    });

    it('should skip fetching from DB and return empty array when provided with empty array of id or undefined', async () => {
      const result = await getByIds();

      expect(result).toEqual([]);
      expect(db.VesselParticipantGroup.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getByCompetitionId', () => {
    it('should call findOne on VesselParticipantGroup with calendar event id where condition', async () => {
      const competitionUnitId = uuid.v4();
      const mockVPG = {
        id: uuid.v4(),
        vesselParticipantGroupId: uuid.v4(),
        name: `Class of ${faker.random.word()}`,
        calendarEventId: uuid.v4(),
        competitionUnitId,
      };
      db.VesselParticipantGroup.findOne.mockResolvedValueOnce({
        toJSON: () => mockVPG,
      });

      const result = await getByCompetitionId(competitionUnitId);

      expect(result).toEqual(mockVPG);
      expect(db.VesselParticipantGroup.findOne).toHaveBeenCalledWith({
        where: {
          competitionUnitId,
        },
        include: defaultIncludeExpectation,
      });
    });
  });

  describe('delete', () => {
    it('should fetch detail if provided with non-array id, call destroy on VesselParticipantGroup and update competition unit that uses the group', async () => {
      const groupId = uuid.v4();
      const mockVPG = {
        id: groupId,
        vesselParticipantGroupId: uuid.v4(),
        name: `Class of ${faker.random.word()}`,
        calendarEventId: uuid.v4(),
      };
      db.VesselParticipantGroup.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return mockVPG;
        },
      });
      db.VesselParticipantGroup.destroy.mockResolvedValueOnce(1);

      const result = await deleteVPG(groupId, mockTransaction);

      expect(result).toEqual(mockVPG);
      expect(db.VesselParticipantGroup.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: [groupId],
          },
        },
        transaction: mockTransaction,
      });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        { vesselParticipantGroupId: null },
        {
          where: {
            vesselParticipantGroupId: {
              [db.Op.in]: [groupId],
            },
          },
          transaction: mockTransaction,
        },
      );
    });

    it('should skip fetch detail if provided with array of id, call destroy on VesselParticipantGroup and update competition unit that uses the group', async () => {
      const groupIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      db.VesselParticipantGroup.destroy.mockResolvedValueOnce(groupIds.length);

      const result = await deleteVPG(groupIds, mockTransaction);

      expect(result).toEqual(groupIds.length);
      expect(db.VesselParticipantGroup.findByPk).not.toHaveBeenCalled();
      expect(db.VesselParticipantGroup.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: groupIds,
          },
        },
        transaction: mockTransaction,
      });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        { vesselParticipantGroupId: null },
        {
          where: {
            vesselParticipantGroupId: {
              [db.Op.in]: groupIds,
            },
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('clear', () => {
    it('should truncate the table', async () => {
      await clear();
      expect(db.VesselParticipantGroup.destroy).toHaveBeenCalledWith({
        truncate: true,
        cascade: true,
        force: true,
      });
    });
  });

  describe('getUnregisteredVessel', () => {
    const vesselParticipantGroupId = uuid.v4();
    const mockAllVessel = {
      count: 1,
      rows: [
        {
          id: uuid.v4(),
          bulkCreated: false,
          publicName: `Vessel of ${faker.random.word()}`,
        },
      ],
      page: 1,
      size: 10,
      sort: 'updatedAt',
      srdir: 'DESC',
      q: '',
      filters: [],
    };
    beforeAll(() => {
      db.Vessel.findAllWithPaging.mockResolvedValue(mockAllVessel);
    });
    afterAll(() => {
      db.Vessel.findAllWithPaging.mockReset();
    });

    it('should not query with publicName condition if provided with empty string query', async () => {
      const paging = { query: '', page: 1, size: 10 };

      const result = await getUnregisteredVessel(
        paging,
        vesselParticipantGroupId,
      );

      expect(result).toEqual(mockAllVessel);
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            '$vesselParticipants.vesselId$': {
              [db.Op.is]: null,
            },
          },
          subQuery: false,
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipants',
              required: false,
              where: {
                vesselParticipantGroupId: {
                  [db.Op.eq]: vesselParticipantGroupId,
                },
              },
            }),
          ]),
        },
        paging,
      );
    });
    it('should have query with publicName condition if provided with non-empty string query', async () => {
      const paging = { query: 'test', page: 1, size: 10 };

      const result = await getUnregisteredVessel(
        paging,
        vesselParticipantGroupId,
      );

      expect(result).toEqual(mockAllVessel);
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            publicName: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
            '$vesselParticipants.vesselId$': {
              [db.Op.is]: null,
            },
          },
          subQuery: false,
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipants',
              required: false,
              where: {
                vesselParticipantGroupId: {
                  [db.Op.eq]: vesselParticipantGroupId,
                },
              },
            }),
          ]),
        },
        paging,
      );
    });
  });

  describe('getUnregisteredParticipants', () => {
    const vesselParticipantGroupId = uuid.v4();
    const mockAllParticipant = {
      count: 1,
      rows: [
        {
          id: uuid.v4(),
          publicName: `Participant #${faker.random.numeric(1)}`,
        },
      ],
      page: 1,
      size: 10,
      sort: 'updatedAt',
      srdir: 'DESC',
      q: '',
      filters: [],
    };
    beforeAll(() => {
      db.Participant.findAllWithPaging.mockResolvedValue(mockAllParticipant);
    });
    afterAll(() => {
      db.Participant.findAllWithPaging.mockReset();
    });

    it('should not query with publicName condition if provided with empty string query', async () => {
      const paging = { query: '', page: 1, size: 10 };

      const result = await getUnregisteredParticipants(
        paging,
        vesselParticipantGroupId,
      );

      expect(result).toEqual(mockAllParticipant);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            '$vesselParticipants.id$': {
              [db.Op.is]: null,
            },
          },
          subQuery: false,
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipants',
              required: false,
              where: {
                vesselParticipantGroupId: {
                  [db.Op.eq]: vesselParticipantGroupId,
                },
              },
            }),
          ]),
        },
        paging,
      );
    });
    it('should query with publicName condition if provided with non-empty string query', async () => {
      const paging = { query: 'test', page: 1, size: 10 };

      const result = await getUnregisteredParticipants(
        paging,
        vesselParticipantGroupId,
      );

      expect(result).toEqual(mockAllParticipant);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            publicName: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
            '$vesselParticipants.id$': {
              [db.Op.is]: null,
            },
          },
          subQuery: false,
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipants',
              required: false,
              where: {
                vesselParticipantGroupId: {
                  [db.Op.eq]: vesselParticipantGroupId,
                },
              },
            }),
          ]),
        },
        paging,
      );
    });
  });

  describe('getParticipants', () => {
    it('should return all participant that are participating in the group (class)', async () => {
      const vesselParticipantGroupId = uuid.v4();
      const mockParticipants = Array(3)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            participantId: uuid.v4(),
            userProfileId: uuid.v4(),
            invitationStatus: participantInvitationStatus.ACCEPTED,
          };
        });
      db.Participant.findAll.mockResolvedValueOnce(mockParticipants);

      const result = await getParticipants(vesselParticipantGroupId);

      expect(result).toEqual(mockParticipants);
      expect(db.Participant.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining([
          'id',
          'participantId',
          'userProfileId',
          'invitationStatus',
        ]),
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'vesselParticipants',
            required: true,
            where: {
              vesselParticipantGroupId,
            },
          }),
        ]),
      });
    });
  });

  describe('getParticipantByEvents', () => {
    it('should return all participant that are participating in the event', async () => {
      const eventId = uuid.v4();
      const mockParticipants = Array(3)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            participantId: uuid.v4(),
            userProfileId: uuid.v4(),
            invitationStatus: participantInvitationStatus.ACCEPTED,
          };
        });
      db.Participant.findAll.mockResolvedValueOnce(mockParticipants);

      const result = await getParticipantByEvents(eventId);

      expect(result).toEqual(mockParticipants);
      expect(db.Participant.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining([
          'id',
          'participantId',
          'userProfileId',
          'invitationStatus',
        ]),
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'vesselParticipants',
            required: true,
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'group',
                required: true,
                include: expect.arrayContaining([
                  expect.objectContaining({
                    as: 'event',
                    where: {
                      id: eventId,
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
});
