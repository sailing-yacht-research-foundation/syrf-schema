const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  upsert,
  getAll,
  getAllByEvent,
  getByGroupParticipant,
  getAllByVpg,
  getById,
  delete: deleveVP,
  clear,
  validateParticipants,
  validateVesselIds,
  getByParticipantAndId,
  addParticipant,
  removeParticipant,
  bulkCreate,
  bulkCreateWithOptions,
  getParticipantCrews,
  getAllByCompetitionUnit,
} = require('../../dataAccess/v1/vesselParticipant');

const db = require('../../index');
const { emptyPagingResponse } = require('../../utils/utils');

describe('Vessel Participant', () => {
  const mockTransaction = db.sequelize.transaction();
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'vessel',
      attributes: expect.arrayContaining(['id', 'publicName', 'orcJsonPolars']),
      paranoid: false,
    }),
    expect.objectContaining({
      as: 'editors',
      attributes: ['id', 'name'],
    }),
    expect.objectContaining({
      as: 'group',
      attributes: expect.arrayContaining(['id', 'vesselParticipantGroupId']),
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'event',
          attributes: ['id', 'name'],
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
      ]),
    }),
    expect.objectContaining({
      as: 'participants',
      attributes: expect.arrayContaining([
        'id',
        'participantId',
        'publicName',
        'trackerUrl',
      ]),
    }),
    expect.objectContaining({
      as: 'owner',
      attributes: ['id', 'name'],
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
      db.VesselParticipant.upsert.mockImplementation(
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
      db.VesselParticipant.upsert.mockReset();
    });
    it('should call upsert on VesselParticipant table and generate random uuid when not provided', async () => {
      const data = {
        vesselParticipantId: uuid.v4(),
        vesselId: uuid.v4(),
        vesselParticipantGroupId: uuid.v4(),
        isCommittee: false,
        sailNumber: `SS${faker.random.numeric(3)}`,
      };

      const result = await upsert(null, data, mockTransaction);

      expect(result).toEqual({
        id: expect.any(String),
        ...data,
      });
      expect(db.VesselParticipant.upsert).toHaveBeenCalledWith(
        {
          id: expect.any(String),
          ...data,
        },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on VesselParticipant table and use the provided uuid without generating new uuid', async () => {
      const vpId = uuid.v4();
      const data = {
        vesselParticipantId: uuid.v4(),
        vesselId: uuid.v4(),
        vesselParticipantGroupId: uuid.v4(),
        isCommittee: false,
        sailNumber: `SS${faker.random.numeric(3)}`,
      };

      const result = await upsert(vpId, data);

      expect(result).toEqual({ id: vpId, ...data });
      expect(db.VesselParticipant.upsert).toHaveBeenCalledWith(
        {
          id: vpId,
          ...data,
        },
        undefined,
      );
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const vpId = uuid.v4();

      const result = await upsert(vpId);

      expect(result).toEqual({ id: vpId });
      expect(db.VesselParticipant.upsert).toHaveBeenCalledWith(
        { id: vpId },
        undefined,
      );
    });
  });

  describe('getAll', () => {
    const vesselParticipantGroupId = uuid.v4();
    const mockAllVP = {
      count: 1,
      rows: [
        {
          id: uuid.v4(),
          vesselParticipantId: uuid.v4(),
          vesselId: uuid.v4(),
          vesselParticipantGroupId,
          isCommittee: false,
          sailNumber: `SS${faker.random.numeric(3)}`,
          // etc. More fields available in actual
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
      query: '',
      page: 1,
      size: 10,
    };
    const expectedInclude = expect.arrayContaining([
      expect.objectContaining({
        as: 'vessel',
        attributes: expect.arrayContaining([
          'id',
          'publicName',
          'vesselId',
          'globalId',
          'lengthInMeters',
        ]),
        paranoid: false,
      }),
      expect.objectContaining({
        as: 'group',
        attributes: ['id', 'vesselParticipantGroupId', 'name'],
      }),
      expect.objectContaining({
        as: 'editors',
        attributes: ['id', 'name'],
      }),
      expect.objectContaining({
        as: 'owner',
        attributes: ['id', 'name'],
      }),
    ]);
    beforeAll(() => {
      db.VesselParticipant.findAllWithPaging.mockResolvedValue(mockAllVP);
    });
    afterAll(() => {
      db.VesselParticipant.findAllWithPaging.mockReset();
    });
    it('should return all vessel participants of an event if provided with vp group (class)', async () => {
      const result = await getAll(paging, { vesselParticipantGroupId });

      expect(result).toEqual(mockAllVP);
      expect(db.VesselParticipant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: { vesselParticipantGroupId },
          include: expectedInclude,
        },
        paging,
      );
    });
    it('should return all vessel participant of a user if not provided with vp group, and have user id', async () => {
      const userId = uuid.v4();

      const result = await getAll(paging, { userId });

      expect(result).toEqual(mockAllVP);
      expect(db.VesselParticipant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: { createdById: userId },
          include: expectedInclude,
        },
        paging,
      );
    });
    it('should query with like condition if provided with a query', async () => {
      const queriedPaging = { ...paging, query: 'test' };
      const result = await getAll(queriedPaging, { vesselParticipantGroupId });

      expect(result).toEqual(mockAllVP);
      expect(db.VesselParticipant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            vesselParticipantId: { [db.Op.like]: '%test%' },
            vesselParticipantGroupId,
          },
          include: expectedInclude,
        },
        queriedPaging,
      );
    });
    it('should not fetch to DB and return empty response if not provided with neither group / user', async () => {
      const result = await getAll(paging);

      expect(result).toEqual(emptyPagingResponse(paging));
      expect(db.VesselParticipant.findAllWithPaging).not.toHaveBeenCalled();
    });
  });

  describe('getAllByEvent', () => {
    const calendarEventId = uuid.v4();
    const mockAllVP = {
      count: 1,
      rows: [
        {
          id: uuid.v4(),
          vesselParticipantId: uuid.v4(),
          vesselId: uuid.v4(),
          vesselParticipantGroupId: uuid.v4(),
          isCommittee: false,
          sailNumber: `SS${faker.random.numeric(3)}`,
          // etc. More fields available in actual
        },
      ],
      page: 1,
      size: 10,
      sort: 'updatedAt',
      srdir: 'DESC',
      q: '',
      filters: [],
    };
    const pagination = {
      query: '',
      page: 1,
      size: 10,
    };
    beforeAll(() => {
      db.VesselParticipant.findAllWithPaging.mockResolvedValue(mockAllVP);
    });
    afterAll(() => {
      db.VesselParticipant.findAllWithPaging.mockReset();
    });
    it('should return all vessel participants of an event', async () => {
      const result = await getAllByEvent(calendarEventId, pagination);

      expect(result).toEqual(mockAllVP);
      expect(db.VesselParticipant.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vessel',
              attributes: expect.arrayContaining([
                'id',
                'publicName',
                'vesselId',
                'globalId',
                'lengthInMeters',
              ]),
              paranoid: false,
            }),
            expect.objectContaining({
              as: 'group',
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantGroupId',
                'name',
                'calendarEventId',
              ]),
              where: {
                calendarEventId,
              },
            }),
            expect.objectContaining({
              as: 'participants',
              attributes: expect.arrayContaining([
                'id',
                'participantId',
                'publicName',
                'trackerUrl',
              ]),
            }),
          ]),
        },
        pagination,
      );
    });
    it('should not fetch to DB and return empty array if not provided with event id', async () => {
      const result = await getAllByEvent(undefined, pagination);

      expect(result).toEqual([]);
      expect(db.VesselParticipant.findAllWithPaging).not.toHaveBeenCalled();
    });
  });

  describe('getByGroupParticipant', () => {
    it('should get vessel participant based on vp group and the participant id', async () => {
      const vesselParticipantId = uuid.v4();
      const vesselParticipantGroupId = uuid.v4();
      const participantId = uuid.v4();

      const mockReturn = {
        id: uuid.v4(),
        vesselParticipantId,
        vesselParticipant: {
          id: vesselParticipantId,
          vesselId: uuid.v4(),
          vesselParticipantGroupId,
          isCommittee: false,
          sailNumber: `SS${faker.random.numeric(3)}`,
        },
      };
      db.VesselParticipantCrew.findOne.mockResolvedValueOnce({
        toJSON: () => mockReturn,
      });

      const result = await getByGroupParticipant(
        vesselParticipantGroupId,
        participantId,
      );

      expect(result).toEqual(mockReturn.vesselParticipant);
      expect(db.VesselParticipantCrew.findOne).toHaveBeenCalledWith({
        where: {
          participantId,
        },
        include: expect.objectContaining({
          as: 'vesselParticipant',
          required: true,
          where: {
            vesselParticipantGroupId,
          },
        }),
        attributes: expect.arrayContaining(['id', 'vesselParticipantId']),
      });
    });
  });

  describe('getAllByVpg', () => {
    it('should run query to VesselParticipant table for VP in the group and return requested attributes', async () => {
      const vesselParticipantGroupId = uuid.v4();
      const mockVPs = Array(5)
        .fill()
        .map(() => {
          const vesselId = uuid.v4();
          return {
            vesselId,
            vessel: {
              id: vesselId,
              publicName: `Vessel #${faker.random.numeric(2)}`,
              sailNumber: `SS${faker.random.numeric(3)}`,
            },
          };
        });
      db.VesselParticipant.findAll.mockResolvedValueOnce(mockVPs);

      const customAttributes = ['id', 'publicName', 'sailNumber'];
      const result = await getAllByVpg(vesselParticipantGroupId, {
        vesselAttributes: customAttributes,
      });

      expect(result).toEqual(mockVPs);
      expect(db.VesselParticipant.findAll).toHaveBeenCalledWith({
        where: {
          vesselParticipantGroupId,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'vessel',
            attributes: customAttributes,
            paranoid: false,
          }),
        ]),
      });
    });
    it('should run query to VesselParticipant table for VP in the group and return default attributes when not specified', async () => {
      const vesselParticipantGroupId = uuid.v4();
      const mockVPs = Array(5)
        .fill()
        .map(() => {
          const vesselId = uuid.v4();
          return {
            vesselId,
            vessel: {
              id: vesselId,
              publicName: `Vessel #${faker.random.numeric(2)}`,
            },
          };
        });
      db.VesselParticipant.findAll.mockResolvedValueOnce(mockVPs);

      const result = await getAllByVpg(vesselParticipantGroupId);

      expect(result).toEqual(mockVPs);
      expect(db.VesselParticipant.findAll).toHaveBeenCalledWith({
        where: {
          vesselParticipantGroupId,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'vessel',
            attributes: expect.arrayContaining(['id', 'publicName']),
            paranoid: false,
          }),
        ]),
      });
    });
    it('should return empty array when not provided with a group id', async () => {
      const result = await getAllByVpg();

      expect(result).toEqual([]);
      expect(db.VesselParticipant.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getAllByCompetitionUnit', () => {
    it('should run query to Competition Unit table for VP in the group and return requested attributes', async () => {
      const competitionUnitId = uuid.v4();
      const mockVPs = Array(5)
        .fill()
        .map(() => {
          const vesselId = uuid.v4();
          return {
            id: uuid.v4(),
            sailNumber: faker.datatype.string(),
            vesselId,
            vessel: {
              id: vesselId,
              publicName: `Vessel #${faker.random.numeric(2)}`,
              sailNumber: `SS${faker.random.numeric(3)}`,
            },
          };
        });

      const mockCompetitionUnit = {
        id: uuid.v4(),
        group: {
          id: uuid.v4(),
          vesselParticipants: mockVPs,
        },
      };

      db.CompetitionUnit.findOne.mockResolvedValueOnce({
        toJSON: () => mockCompetitionUnit,
      });

      const result = await getAllByCompetitionUnit(competitionUnitId);

      expect(result).toEqual(mockVPs);
      expect(db.CompetitionUnit.findOne).toHaveBeenCalledWith({
        where: {
          id: competitionUnitId,
        },
        include: [
          {
            model: db.VesselParticipantGroup,
            as: 'group',
            attributes: {
              exclude: ['createdById', 'updatedById', 'developerId'],
            },
            include: [
              {
                model: db.VesselParticipant,
                as: 'vesselParticipants',
                attributes: {
                  exclude: ['createdById', 'updatedById', 'developerId'],
                },
                include: [
                  {
                    model: db.Vessel,
                    as: 'vessel',
                    attributes: ['id', 'publicName'],
                    paranoid: false,
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it('should return empty array when not found', async () => {
      const competitionUnitId = uuid.v4();
      db.CompetitionUnit.findOne.mockResolvedValueOnce(null);
      const result = await getAllByCompetitionUnit(competitionUnitId);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should call findByPk on VesselParticipant with default include', async () => {
      const data = {
        id: uuid.v4(),
        vesselId: uuid.v4(),
        vesselParticipantGroupId: uuid.v4(),
        isCommittee: false,
        sailNumber: `SS${faker.random.numeric(3)}`,
      };
      db.VesselParticipant.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return data;
        },
      });
      const result = await getById(data.id);

      expect(result).toEqual(data);
      expect(db.VesselParticipant.findByPk).toHaveBeenCalledWith(data.id, {
        include: defaultIncludeExpectation,
      });
    });
  });

  describe('delete', () => {
    const mockVP = {
      id: uuid.v4(),
      vesselId: uuid.v4(),
      vesselParticipantGroupId: uuid.v4(),
      isCommittee: false,
      sailNumber: `SS${faker.random.numeric(3)}`,
    };
    const mockCrews = Array(4)
      .fill()
      .map(() => {
        return {
          id: uuid.v4(),
        };
      });
    beforeAll(() => {
      db.VesselParticipant.findByPk.mockResolvedValue({
        toJSON: () => {
          return mockVP;
        },
      });
      db.VesselParticipantCrew.findAll.mockResolvedValue(mockCrews);
      db.VesselParticipantTrackJson.destroy.mockResolvedValue(0);
      db.VesselParticipant.destroy.mockResolvedValue(1);
      db.VesselParticipantCrew.destroy.mockResolvedValue(mockCrews.length);
      db.VesselParticipantCrewTrackJson.destroy.mockResolvedValue(
        mockCrews.length,
      );
    });
    afterAll(() => {
      db.VesselParticipant.findByPk.mockReset();
      db.VesselParticipantCrew.findAll.mockReset();
      db.VesselParticipantTrackJson.destroy.mockReset();
      db.VesselParticipant.destroy.mockReset();
      db.VesselParticipantCrew.destroy.mockReset();
      db.VesselParticipantCrewTrackJson.destroy.mockReset();
    });

    it('should fetch detail if provided with non-array id, call destroy on VesselParticipant, and other children tables', async () => {
      db.VesselParticipantGroup.destroy.mockResolvedValueOnce(1);

      const result = await deleveVP(mockVP.id, mockTransaction);

      expect(result).toEqual(mockVP);

      expect(db.VesselParticipant.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantTrackJson.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantCrewTrackJson.destroy).toHaveBeenCalledTimes(
        1,
      );
      expect(db.VesselParticipant.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: [mockVP.id],
          },
        },
        transaction: mockTransaction,
      });
      expect(db.VesselParticipantTrackJson.destroy).toHaveBeenCalledWith({
        where: {
          vesselParticipantId: {
            [db.Op.in]: [mockVP.id],
          },
        },
        transaction: mockTransaction,
      });
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledWith({
        where: {
          vesselParticipantId: {
            [db.Op.in]: [mockVP.id],
          },
        },
        transaction: mockTransaction,
      });
      expect(db.VesselParticipantCrewTrackJson.destroy).toHaveBeenCalledWith({
        where: {
          vesselParticipantCrewId: {
            [db.Op.in]: mockCrews.map((row) => row.id),
          },
        },
        transaction: mockTransaction,
      });
    });

    it('should skip fetch detail if provided with array of id, call destroy on VesselParticipant, and other children tables', async () => {
      const vpIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      db.VesselParticipant.destroy.mockResolvedValue(vpIds.length);

      const result = await deleveVP(vpIds, mockTransaction);

      expect(result).toEqual(vpIds.length);
      expect(db.VesselParticipant.findByPk).not.toHaveBeenCalled();
      expect(db.VesselParticipant.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantTrackJson.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantCrewTrackJson.destroy).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('clear', () => {
    it('should truncate the table', async () => {
      await clear();
      expect(db.VesselParticipant.destroy).toHaveBeenCalledWith({
        truncate: true,
        cascade: true,
        force: true,
      });
    });
  });

  describe('validateParticipants', () => {
    const mockVP = {
      id: uuid.v4(),
      vesselId: uuid.v4(),
      vesselParticipantGroupId: uuid.v4(),
      isCommittee: false,
      sailNumber: `SS${faker.random.numeric(3)}`,
    };
    beforeAll(() => {
      db.VesselParticipant.findAll.mockResolvedValue([mockVP]);
    });
    afterAll(() => {
      db.VesselParticipant.findAll.mockReset();
    });
    it('should query to VesselParticipant with specified params, excluding the specified id', async () => {
      const participantId = uuid.v4();
      const excludedID = uuid.v4();
      const result = await validateParticipants(
        mockVP.vesselParticipantGroupId,
        excludedID,
        [participantId],
      );

      expect(result).toEqual([mockVP]);
      expect(db.VesselParticipant.findAll).toHaveBeenLastCalledWith({
        where: {
          vesselParticipantGroupId: mockVP.vesselParticipantGroupId,
          id: {
            [db.Op.ne]: excludedID,
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participants',
            where: {
              id: {
                [db.Op.in]: [participantId],
              },
            },
          }),
        ]),
      });
    });

    it('should query with empty array if participantIds not provided', async () => {
      const excludedID = uuid.v4();
      const result = await validateParticipants(
        mockVP.vesselParticipantGroupId,
        excludedID,
      );

      expect(result).toEqual([mockVP]);
      expect(db.VesselParticipant.findAll).toHaveBeenLastCalledWith({
        where: {
          vesselParticipantGroupId: mockVP.vesselParticipantGroupId,
          id: {
            [db.Op.ne]: excludedID,
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participants',
            where: {
              id: {
                [db.Op.in]: [],
              },
            },
          }),
        ]),
      });
    });
  });

  describe('validateVesselIds', () => {
    it('should trigger findAll on VesselParticipant with the provided parameters', async () => {
      const mockVP = {
        id: uuid.v4(),
        vesselId: uuid.v4(),
        vesselParticipantGroupId: uuid.v4(),
        isCommittee: false,
        sailNumber: `SS${faker.random.numeric(3)}`,
      };
      db.VesselParticipant.findAll.mockResolvedValueOnce([mockVP]);

      const excludedID = uuid.v4();
      const result = await validateVesselIds(
        mockVP.vesselParticipantGroupId,
        excludedID,
        mockVP.vesselId,
      );

      expect(result).toEqual([mockVP]);
      expect(db.VesselParticipant.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.ne]: excludedID,
          },
          vesselParticipantGroupId: mockVP.vesselParticipantGroupId,
          vesselId: mockVP.vesselId,
        },
      });
    });
  });

  describe('getByParticipantAndId', () => {
    const mockVP = {
      id: uuid.v4(),
      vesselId: uuid.v4(),
      vesselParticipantGroupId: uuid.v4(),
      isCommittee: false,
      sailNumber: `SS${faker.random.numeric(3)}`,
    };
    beforeAll(() => {
      db.VesselParticipant.findOne.mockResolvedValue({ toJSON: () => mockVP });
    });
    afterAll(() => {
      db.VesselParticipant.findOne.mockReset();
    });
    it('should trigger findOne one VesselParticipant with provided parameters', async () => {
      const participantIds = [uuid.v4()];
      const result = await getByParticipantAndId(mockVP.id, participantIds);

      expect(result).toEqual(mockVP);
      expect(db.VesselParticipant.findOne).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipant.findOne).toHaveBeenCalledWith({
        where: {
          id: mockVP.id,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participants',
            required: false,
            where: {
              id: {
                [db.Op.in]: participantIds,
              },
            },
          }),
          expect.objectContaining({
            as: 'group',
            attributes: expect.arrayContaining([
              'id',
              'vesselParticipantGroupId',
            ]),
            include: expect.arrayContaining([
              expect.objectContaining({
                attributes: expect.arrayContaining(['id', 'name']),
                as: 'event',
                include: [
                  expect.objectContaining({
                    as: 'editors',
                    attributes: expect.arrayContaining(['id', 'name']),
                    through: {
                      attributes: [],
                    },
                  }),
                  expect.objectContaining({
                    as: 'owner',
                    attributes: expect.arrayContaining(['id', 'name']),
                  }),
                ],
              }),
            ]),
          }),
        ]),
      });
    });
    it('should trigger findOne one VesselParticipant with empty array of participant when not provided', async () => {
      const result = await getByParticipantAndId(mockVP.id);

      expect(result).toEqual(mockVP);
      expect(db.VesselParticipant.findOne).toHaveBeenCalledWith({
        where: {
          id: mockVP.id,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participants',
            required: false,
            where: {
              id: {
                [db.Op.in]: [],
              },
            },
          }),
        ]),
      });
    });
  });

  describe('addParticipant', () => {
    const vesselParticipantId = uuid.v4();
    const participantIds = Array(5)
      .fill()
      .map(() => uuid.v4());
    const mockCrews = participantIds.map((participantId) => {
      return {
        id: uuid.v4(),
        startedStream: false,
        participantId,
        vesselParticipantId,
      };
    });
    beforeAll(() => {
      db.VesselParticipantCrew.bulkCreate.mockResolvedValue(mockCrews);
    });
    afterAll(() => {
      db.VesselParticipantCrew.bulkCreate.mockReset();
    });
    it('should call bulkCreate on VesselParticipantCrew when adding participant', async () => {
      const result = await addParticipant(
        vesselParticipantId,
        participantIds,
        mockTransaction,
      );

      expect(result).toEqual(mockCrews);
      expect(db.VesselParticipantCrew.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining(
          participantIds.map((participantId) => ({
            vesselParticipantId,
            participantId,
          })),
        ),
        {
          transaction: mockTransaction,
        },
      );
    });

    it('should not fetch to DB when no participant is added (provided with empty array)', async () => {
      const result = await addParticipant(
        vesselParticipantId,
        undefined,
        mockTransaction,
      );

      expect(result).toEqual([]);
      expect(db.VesselParticipantCrew.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('removeParticipant', () => {
    it('should call destroy on VesselParticipantCrew when removing participant', async () => {
      const vesselParticipantId = uuid.v4();
      const participantId = uuid.v4();
      db.VesselParticipantCrew.destroy.mockResolvedValueOnce(1);

      const result = await removeParticipant(
        vesselParticipantId,
        participantId,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledWith({
        where: {
          vesselParticipantId,
          participantId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on VesselParticipant', async () => {
      const mockVPs = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            vesselId: uuid.v4(),
            vesselParticipantGroupId: uuid.v4(),
            isCommittee: false,
            sailNumber: `SS${faker.random.numeric(3)}`,
          };
        });
      db.VesselParticipant.bulkCreate.mockResolvedValue(mockVPs);

      const result = await bulkCreate(mockVPs, mockTransaction);

      expect(result).toEqual(mockVPs);
      expect(db.VesselParticipant.bulkCreate).toHaveBeenCalledWith(mockVPs, {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      });
    });

    it('should not fetch to DB when provided with empty array', async () => {
      const result = await bulkCreate([], mockTransaction);

      expect(result).toEqual([]);
      expect(db.VesselParticipant.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('bulkCreateWithOptions', () => {
    it('should call bulkCreate on VesselParticipant with customizable options', async () => {
      const mockVPs = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            vesselId: uuid.v4(),
            vesselParticipantGroupId: uuid.v4(),
            isCommittee: false,
            sailNumber: `SS${faker.random.numeric(3)}`,
          };
        });
      db.VesselParticipant.bulkCreate.mockResolvedValue(mockVPs);

      const result = await bulkCreateWithOptions(mockVPs, {
        transaction: mockTransaction,
      });

      expect(result).toEqual(mockVPs);
      expect(db.VesselParticipant.bulkCreate).toHaveBeenCalledWith(mockVPs, {
        transaction: mockTransaction,
      });
    });

    it('should not fetch to DB when provided with empty array', async () => {
      const result = await bulkCreateWithOptions([], mockTransaction);

      expect(result).toEqual([]);
      expect(db.VesselParticipant.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('getParticipantCrews', () => {
    it('should call findAll on VesselParticipantCrew', async () => {
      const vesselParticipantIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      const mockCrews = vesselParticipantIds.map((vesselParticipantId) => {
        return {
          id: uuid.v4(),
          startedStream: false,
          participantId: uuid.v4(),
          vesselParticipantId,
        };
      });
      db.VesselParticipantCrew.findAll.mockResolvedValue(
        mockCrews.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getParticipantCrews(vesselParticipantIds);

      expect(result).toEqual(mockCrews);
      expect(db.VesselParticipantCrew.findAll).toHaveBeenCalledWith({
        where: {
          vesselParticipantId: {
            [db.Op.in]: vesselParticipantIds,
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participant',
          }),
        ]),
      });
    });
  });
});
