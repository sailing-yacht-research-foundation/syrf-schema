const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  upsert,
  getAll,
  getAllByEvent,
  getByGroupParticipant,
  getAllByVpg,
} = require('../../dataAccess/v1/vesselParticipant');

const db = require('../../index');
const { emptyPagingResponse } = require('../../utils/utils');

describe('Vessel Participant Group', () => {
  const mockTransaction = db.sequelize.transaction();
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
});
