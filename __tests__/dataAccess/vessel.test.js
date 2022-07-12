const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  create,
  update,
  upsert,
  getAll,
  getById,
  delete: deleteVessel,
  getAllForEvent,
  getAllRegisteredInEvent,
  getByVesselIdAndSource,
  bulkCreate,
  bulkCreateWithOptions,
  addEditors,
  addGroupEditors,
  removeAllEditors,
  removeAllGroupEditors,
  validateAdminsById,
  removeUsersFromEditor,
  removeGroupsFromEditor,
  getUserVessels,
  getBulkVesselEditors,
  getUserDefaultVessel,
  setAsDefaultVessel,
  getVesselParticipants,
} = require('../../dataAccess/v1/vessel');

const db = require('../../index');
const { emptyPagingResponse } = require('../../utils/utils');
const {
  participantInvitationStatus,
  groupMemberStatus,
} = require('../../enums');

describe('Vessel DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'editors',
      attributes: ['id', 'name', 'avatar'],
    }),
    expect.objectContaining({
      as: 'groupEditors',
      attributes: expect.arrayContaining(['id', 'groupName', 'groupImage']),
      required: false,
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'groupMember',
          attributes: ['id', 'userId'],
          required: false,
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'member',
              attributes: ['name'],
            }),
          ]),
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

  describe('create', () => {
    it('should call create on Vessel table', async () => {
      const data = {
        publicName: `Vessel of ${faker.name.findName()}`,
        lengthInMeters: faker.datatype.number({ max: 100 }),
      };
      const mockCreateReturn = {
        id: uuid.v4(),
        ...data,
      };
      db.Vessel.create.mockResolvedValueOnce(mockCreateReturn);

      const result = await create(data, mockTransaction);

      expect(result).toEqual(mockCreateReturn);
      expect(db.Vessel.create).toHaveBeenCalledWith(data, {
        validate: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('update', () => {
    it('should call update on Vessel table', async () => {
      const data = {
        publicName: `Vessel of ${faker.name.findName()}`,
        lengthInMeters: faker.datatype.number({ max: 100 }),
      };
      const vesselId = uuid.v4();
      db.Vessel.update.mockResolvedValueOnce([1, [{ vesselId, ...data }]]);

      const result = await update(vesselId, data, mockTransaction);

      expect(result).toEqual({
        updateCount: 1,
        updatedData: [{ vesselId, ...data }],
      });
      expect(db.Vessel.update).toHaveBeenCalledWith(data, {
        where: {
          id: vesselId,
        },
        returning: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('upsert', () => {
    beforeAll(() => {
      db.Vessel.upsert.mockImplementation(async (detail, _transaction) => {
        return [
          {
            toJSON: () => {
              return { ...detail };
            },
          },
          true,
        ];
      });
    });
    afterAll(() => {
      db.Vessel.upsert.mockReset();
    });
    it('should call upsert on Vessel table and generate random uuid when not provided', async () => {
      const data = {
        publicName: `Vessel of ${faker.name.findName()}`,
        lengthInMeters: faker.datatype.number({ max: 100 }),
      };

      const result = await upsert(null, data, mockTransaction);

      expect(result).toEqual({
        id: expect.any(String),
        ...data,
      });
      expect(db.Vessel.upsert).toHaveBeenCalledWith(
        {
          id: expect.any(String),
          ...data,
        },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on Vessel table and use the provided uuid', async () => {
      const vesselId = uuid.v4();
      const data = {
        publicName: `Vessel of ${faker.name.findName()}`,
        lengthInMeters: faker.datatype.number({ max: 100 }),
      };

      const result = await upsert(vesselId, data);

      expect(result).toEqual({ id: vesselId, ...data });
      expect(db.Vessel.upsert).toHaveBeenCalledWith(
        { id: vesselId, ...data },
        undefined,
      );
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const vesselId = uuid.v4();

      const result = await upsert(vesselId);

      expect(result).toEqual({ id: vesselId });
      expect(db.Vessel.upsert).toHaveBeenCalledWith(
        { id: vesselId },
        undefined,
      );
    });
  });

  describe('getAll', () => {
    const mockAllVessel = {
      count: 1,
      rows: [
        {
          id: uuid.v4(),
          publicName: `Vessel of ${faker.name.findName()}`,
          lengthInMeters: faker.datatype.number({ max: 100 }),
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
    it('should run findAllWithPaging and return all vessel ', async () => {
      const paging = {
        query: 'test',
        page: 1,
        size: 10,
      };
      const result = await getAll(paging);

      expect(result).toEqual(mockAllVessel);
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            publicName: {
              [db.Op.like]: '%test%',
            },
          },
        },
        paging,
      );
    });
    it('should return all vessel of the user if provided with filters without scope, and have user id', async () => {
      const userId = uuid.v4();
      const paging = {
        query: '',
        page: 1,
        size: 10,
        filters: [{ field: 'test' }],
      };
      const result = await getAll(paging, { userId });

      expect(result).toEqual(mockAllVessel);
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: { createdById: userId },
        },
        paging,
      );
    });
    it('should not fetch to DB and return empty response if provided with filter without scope, and no user id', async () => {
      const paging = {
        query: '',
        page: 1,
        size: 10,
        filters: [],
      };
      const result = await getAll(paging);

      expect(result).toEqual(emptyPagingResponse(paging));
      expect(db.Vessel.findAllWithPaging).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should call findByPk on Vessel with default include', async () => {
      const data = {
        id: uuid.v4(),
        publicName: `Vessel of ${faker.name.findName()}`,
        lengthInMeters: faker.datatype.number({ max: 100 }),
        editors: [{ id: uuid.v4(), name: faker.name.findName() }],
        groupEditors: [
          {
            id: uuid.v4(),
            groupMember: [
              {
                userId: uuid.v4(),
                member: {
                  name: faker.name.findName(),
                },
              },
            ],
          },
        ],
      };
      db.Vessel.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return data;
        },
      });
      const result = await getById(data.id);

      expect(result).toEqual({
        ...data,
        combinedEditors: [
          ...data.editors,
          ...data.groupEditors
            .map((row) => {
              return row.groupMember.map((member) => {
                return {
                  id: member.userId,
                  name: member.member.name,
                };
              });
            })
            .flat(),
        ],
      });
      expect(db.Vessel.findByPk).toHaveBeenCalledWith(data.id, {
        include: defaultIncludeExpectation,
        paranoid: true,
      });
    });

    it('should call return undefined if vessel not found', async () => {
      db.Vessel.findByPk.mockResolvedValueOnce(undefined);
      const result = await getById(uuid.v4(), { paranoid: false });

      expect(result).toEqual(undefined);
      expect(db.Vessel.findByPk).toHaveBeenCalledWith(expect.any(String), {
        include: defaultIncludeExpectation,
        paranoid: false,
      });
    });
  });

  describe('delete', () => {
    const mockVessel = {
      id: uuid.v4(),
      publicName: `Vessel of ${faker.name.findName()}`,
      lengthInMeters: faker.datatype.number({ max: 100 }),
      editors: [{ id: uuid.v4(), name: faker.name.findName() }],
      groupEditors: [
        {
          id: uuid.v4(),
          groupMember: [
            {
              userId: uuid.v4(),
              member: {
                name: faker.name.findName(),
              },
            },
          ],
        },
      ],
    };
    beforeAll(() => {
      db.Vessel.findByPk.mockResolvedValue({
        toJSON: () => {
          return mockVessel;
        },
      });
      db.Vessel.destroy.mockResolvedValue(1);
    });
    afterAll(() => {
      db.Vessel.findByPk.mockReset();
      db.Vessel.destroy.mockReset();
    });

    it('should fetch detail and call destroy on vessel table', async () => {
      const result = await deleteVessel(
        mockVessel.id,
        { force: true },
        mockTransaction,
      );

      expect(result).toEqual(mockVessel);
      expect(db.Vessel.destroy).toHaveBeenCalledTimes(1);
      expect(db.Vessel.destroy).toHaveBeenCalledWith({
        where: {
          id: mockVessel.id,
        },
        force: true,
        transaction: mockTransaction,
      });
    });

    it('should not force delete when id not provided with the option', async () => {
      const result = await deleteVessel(
        mockVessel.id,
        undefined,
        mockTransaction,
      );

      expect(result).toEqual(mockVessel);
      expect(db.Vessel.destroy).toHaveBeenCalledTimes(1);
      expect(db.Vessel.destroy).toHaveBeenCalledWith({
        where: {
          id: mockVessel.id,
        },
        force: false,
        transaction: mockTransaction,
      });
    });

    it('should skip delete query if vessel not found', async () => {
      db.Vessel.findByPk.mockResolvedValueOnce(undefined);
      const result = await deleteVessel(uuid.v4(), mockTransaction);

      expect(result).toEqual(undefined);
      expect(db.Vessel.destroy).not.toHaveBeenCalled();
    });
  });

  describe('getAllForEvent', () => {
    const userId = uuid.v4();
    const calendarEventId = uuid.v4();
    const mockAllVessel = {
      count: 5,
      rows: Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            publicName: `Vessel of ${faker.name.findName()}`,
            lengthInMeters: faker.datatype.number({ max: 100 }),
            scope: calendarEventId,
          };
        }),
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

    it('should call findAllWithPaging on Vessel with scope to provided event or is created by the user', async () => {
      const result = await getAllForEvent(userId, calendarEventId);

      expect(result).toEqual(mockAllVessel);
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            [db.Op.or]: [
              {
                createdById: userId,
                bulkCreated: false,
              },
              {
                scope: calendarEventId,
              },
            ],
          },
        },
        {},
      );
    });

    it('should add like condition to where when provided with a query', async () => {
      const paging = {
        page: 1,
        size: 10,
        query: 'test',
      };
      const result = await getAllForEvent(userId, calendarEventId, paging);

      expect(result).toEqual(mockAllVessel);
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            [db.Op.or]: [
              {
                createdById: userId,
                bulkCreated: false,
              },
              {
                scope: calendarEventId,
              },
            ],
            publicName: {
              [db.Op.like]: '%test%',
            },
          },
        },
        paging,
      );
    });
  });

  describe('getAllRegisteredInEvent', () => {
    it('shouild fetch both vessel and the participants on it', async () => {
      const eventId = uuid.v4();
      const mockVessels = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            publicName: `Vessel of ${faker.name.findName()}`,
            lengthInMeters: faker.datatype.number({ max: 100 }),
            sailNumber: `SS${faker.random.numeric(3)}`,
          };
        });
      const mockVPs = Array(3)
        .fill()
        .map((_row, index) => {
          return {
            id: uuid.v4(),
            vesselId: mockVessels[index].id,
            sailNumber: `SS${faker.random.numeric(3)}`,
          };
        });
      db.Vessel.findAllWithPaging.mockResolvedValueOnce({
        count: 5,
        rows: mockVessels.map((row) => {
          return { id: row.id, toJSON: () => row };
        }),
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      });
      db.VesselParticipant.findAll.mockResolvedValueOnce(
        mockVPs.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getAllRegisteredInEvent(eventId);

      expect(result.rows).toEqual(
        mockVessels.map((vessel) => {
          return {
            ...vessel,
            sailNumber: expect.anything(),
            vesselParticipants: expect.any(Array),
          };
        }),
      );
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: {
            exclude: ['orcJsonPolars'],
          },
          where: {
            id: {
              [db.Op.in]: expect.anything(),
            },
          },
          bind: {
            eventId,
          },
        },
        {},
      );
      expect(db.VesselParticipant.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining(['id', 'vesselId', 'sailNumber']),
        where: {
          vesselId: {
            [db.Op.in]: mockVessels.map((row) => row.id),
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'group',
            attributes: expect.arrayContaining([
              'id',
              'name',
              'vesselParticipantGroupId',
              'calendarEventId',
            ]),
            where: {
              calendarEventId: eventId,
            },
          }),
          expect.objectContaining({
            as: 'crews',
            attributes: expect.arrayContaining([
              'id',
              'publicName',
              'invitationStatus',
            ]),
            where: {
              invitationStatus: {
                [db.Op.in]: [
                  participantInvitationStatus.ACCEPTED,
                  participantInvitationStatus.SELF_REGISTERED,
                ],
              },
            },
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'profile',
                attributes: expect.arrayContaining([
                  'id',
                  'name',
                  'country',
                  'avatar',
                ]),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('getByVesselIdAndSource', () => {
    const mockVessels = Array(5)
      .fill()
      .map(() => {
        return {
          id: uuid.v4(),
          vesselId: uuid.v4(),
        };
      });
    it('should fetch by vesselId (original id from scraped source) with IN operator if provided with array of uuid', async () => {
      db.Vessel.findAll.mockResolvedValueOnce(mockVessels);
      const source = 'TRACTRAC';
      const originalVesselIds = mockVessels.map((row) => row.vesselId);

      const result = await getByVesselIdAndSource(originalVesselIds, source);

      expect(result).toEqual(mockVessels);
      expect(db.Vessel.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining(['id', 'vesselId']),
        where: {
          source,
          vesselId: {
            [db.Op.in]: originalVesselIds,
          },
        },
      });
    });
    it('should fetch by vesselId if provided with a string', async () => {
      const source = 'TRACTRAC';
      const vesselId = mockVessels[0].vesselId;
      const mockReturn = mockVessels.filter((row) => row.vesselId === vesselId);
      db.Vessel.findAll.mockResolvedValueOnce(mockReturn);

      const result = await getByVesselIdAndSource(vesselId, source);

      expect(result).toEqual(mockReturn);
      expect(db.Vessel.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining(['id', 'vesselId']),
        where: {
          source,
          vesselId,
        },
      });
    });
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on Vessel', async () => {
      const mockVessels = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            publicName: `Vessel of ${faker.name.findName()}`,
            lengthInMeters: faker.datatype.number({ max: 100 }),
            sailNumber: `SS${faker.random.numeric(3)}`,
          };
        });
      db.Vessel.bulkCreate.mockResolvedValueOnce(mockVessels);

      const result = await bulkCreate(mockVessels, mockTransaction);

      expect(result).toEqual(mockVessels);
      expect(db.Vessel.bulkCreate).toHaveBeenCalledWith(mockVessels, {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      });
    });

    it('should not insert to DB when provided with empty array', async () => {
      const result = await bulkCreate([]);

      expect(result).toEqual([]);
      expect(db.VesselParticipant.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('bulkCreateWithOptions', () => {
    it('should call bulkCreate on Vessel with customizable options', async () => {
      const mockVessels = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            publicName: `Vessel of ${faker.name.findName()}`,
            lengthInMeters: faker.datatype.number({ max: 100 }),
            sailNumber: `SS${faker.random.numeric(3)}`,
          };
        });
      db.Vessel.bulkCreate.mockResolvedValue(mockVessels);

      const result = await bulkCreateWithOptions(mockVessels, {
        transaction: mockTransaction,
      });

      expect(result).toEqual(mockVessels);
      expect(db.Vessel.bulkCreate).toHaveBeenCalledWith(mockVessels, {
        transaction: mockTransaction,
      });
    });

    it('should not insert to DB when provided with empty array', async () => {
      const result = await bulkCreateWithOptions([], mockTransaction);

      expect(result).toEqual([]);
      expect(db.Vessel.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('addEditors', () => {
    it('should bulkCreate VesselEditor when provided with array of editors', async () => {
      const vesselId = uuid.v4();
      const editors = Array(5)
        .fill()
        .map(() => uuid.v4());
      const mockVesselEditors = editors.map((userProfileId) => {
        return {
          vesselId,
          userProfileId,
        };
      });
      db.VesselEditor.bulkCreate.mockResolvedValueOnce(mockVesselEditors);

      const result = await addEditors(vesselId, editors, mockTransaction);

      expect(result).toEqual(mockVesselEditors);
      expect(db.VesselEditor.bulkCreate).toHaveBeenCalledWith(
        mockVesselEditors,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction: mockTransaction,
        },
      );
    });

    it('should not call any DB operation when provided with empty array', async () => {
      const result = await addEditors(uuid.v4(), [], mockTransaction);

      expect(result).toEqual([]);
      expect(db.VesselEditor.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('addGroupEditors', () => {
    it('should bulkCreate VesselGroupEditor when provided with array of groups', async () => {
      const vesselId = uuid.v4();
      const groups = Array(3)
        .fill()
        .map(() => uuid.v4());
      const mockGroupEditors = groups.map((groupId) => {
        return {
          vesselId,
          groupId,
        };
      });
      db.VesselGroupEditor.bulkCreate.mockResolvedValueOnce(mockGroupEditors);

      const result = await addGroupEditors(vesselId, groups, mockTransaction);

      expect(result).toEqual(mockGroupEditors);
      expect(db.VesselGroupEditor.bulkCreate).toHaveBeenCalledWith(
        mockGroupEditors,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction: mockTransaction,
        },
      );
    });

    it('should not call any DB operation when provided with empty array', async () => {
      const result = await addGroupEditors(uuid.v4(), [], mockTransaction);

      expect(result).toEqual([]);
      expect(db.VesselGroupEditor.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('removeAllEditors', () => {
    it('should call destroy on VesselEditor for the selected vessel', async () => {
      const vesselId = uuid.v4();
      db.VesselEditor.destroy.mockResolvedValueOnce(1);

      const result = await removeAllEditors(vesselId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.VesselEditor.destroy).toHaveBeenCalledWith({
        where: { vesselId },
        transaction: mockTransaction,
      });
    });
  });

  describe('removeAllGroupEditors', () => {
    it('should call destroy on VesselGroupEditor for the selected vessel', async () => {
      const vesselId = uuid.v4();
      db.VesselGroupEditor.destroy.mockResolvedValueOnce(1);

      const result = await removeAllGroupEditors(vesselId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.VesselGroupEditor.destroy).toHaveBeenCalledWith({
        where: { vesselId },
        transaction: mockTransaction,
      });
    });
  });

  describe('validateAdminsById', () => {
    it('should return vessel detail, and whether user is owner/editor', async () => {
      const vesselId = uuid.v4();
      const userId = uuid.v4();
      const data = {
        id: vesselId,
        publicName: `Vessel of ${faker.name.findName()}`,
        lengthInMeters: faker.datatype.number({ max: 100 }),
        editors: [{ id: uuid.v4() }],
        createdById: userId,
        groupEditors: [
          {
            id: uuid.v4(),
            groupMember: [
              {
                id: uuid.v4(),
                userId,
              },
            ],
          },
        ],
      };
      db.Vessel.findByPk.mockResolvedValueOnce({ toJSON: () => data });

      const result = await validateAdminsById(vesselId, userId);

      expect(result).toEqual({
        isOwner: true,
        isEditor: true,
        vessel: data,
      });
      expect(db.Vessel.findByPk).toHaveBeenCalledWith(
        vesselId,
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'editors',
              attributes: expect.arrayContaining(['id']),
            }),
            expect.objectContaining({
              as: 'groupEditors',
              attributes: expect.arrayContaining(['id']),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'groupMember',
                  attributes: expect.arrayContaining(['userId']),
                  where: {
                    status: groupMemberStatus.accepted,
                  },
                }),
              ]),
            }),
          ]),
          attributes: expect.arrayContaining([
            'id',
            'createdById',
            'isDefaultVessel',
          ]),
        }),
      );
    });
    it('should return falses when vessel not found', async () => {
      const vesselId = uuid.v4();
      const userId = uuid.v4();
      db.Vessel.findByPk.mockResolvedValueOnce(undefined);

      const result = await validateAdminsById(vesselId, userId);

      expect(result).toEqual({
        isOwner: false,
        isEditor: false,
        vessel: undefined,
      });
      expect(db.Vessel.findByPk).toHaveBeenCalledWith(
        vesselId,
        expect.anything(),
      );
    });

    it('should return default values if provided id is falsy', async () => {
      const result = await validateAdminsById(null, uuid.v4());

      expect(result).toEqual({
        isOwner: false,
        isEditor: false,
        vessel: undefined,
      });
      expect(db.Vessel.findByPk).not.toHaveBeenCalled();
    });
  });

  describe('removeUsersFromEditor', () => {
    it('should remove users from VesselEditor table of a vessel', async () => {
      const vesselId = uuid.v4();
      const mockUsers = Array(3)
        .fill()
        .map(() => uuid.v4());
      db.VesselEditor.destroy.mockResolvedValueOnce(mockUsers.length);

      const result = await removeUsersFromEditor(
        vesselId,
        mockUsers,
        mockTransaction,
      );

      expect(result).toEqual(mockUsers.length);
      expect(db.VesselEditor.destroy).toHaveBeenCalledWith({
        where: {
          vesselId,
          userProfileId: {
            [db.Op.in]: mockUsers,
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('removeGroupsFromEditor', () => {
    it('should remove groups from VesselGroupEditor table of a vessel', async () => {
      const vesselId = uuid.v4();
      const mockGroups = Array(2)
        .fill()
        .map(() => uuid.v4());
      db.VesselGroupEditor.destroy.mockResolvedValueOnce(mockGroups.length);

      const result = await removeGroupsFromEditor(
        vesselId,
        mockGroups,
        mockTransaction,
      );

      expect(result).toEqual(mockGroups.length);
      expect(db.VesselGroupEditor.destroy).toHaveBeenCalledWith({
        where: {
          vesselId,
          groupId: {
            [db.Op.in]: mockGroups,
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getUserVessels', () => {
    const userId = uuid.v4();
    const paging = { page: 1, size: 10, query: '' };
    const mockAllVessel = {
      count: 3,
      rows: [
        {
          id: uuid.v4(),
          publicName: `Vessel of ${faker.name.findName()}`,
          lengthInMeters: faker.datatype.number({ max: 100 }),
          editors: [],
          groupEditors: [],
        },
        {
          id: uuid.v4(),
          publicName: `Vessel of ${faker.name.findName()}`,
          lengthInMeters: faker.datatype.number({ max: 100 }),
          editors: [
            {
              id: userId,
              name: faker.name.findName(),
            },
          ],
          groupEditors: [],
        },
        {
          id: uuid.v4(),
          publicName: `Vessel of ${faker.name.findName()}`,
          lengthInMeters: faker.datatype.number({ max: 100 }),
          editors: [],
          groupEditors: [
            {
              id: uuid.v4(),
              groupName: `Group ${faker.name.findName()}`,
              groupMember: [{ id: uuid.v4(), userId }],
            },
          ],
        },
      ],
      page: 1,
      size: 10,
      sort: 'updatedAt',
      srdir: 'DESC',
      q: '',
      filters: [],
    };
    const defaultWhereExpectation = {
      [db.Op.and]: [
        {
          [db.Op.or]: [
            { createdById: userId },
            db.Sequelize.where(db.Sequelize.literal(`"editors"."id"`), {
              [db.Op.ne]: null,
            }),
            db.Sequelize.where(
              db.Sequelize.literal(`"groupEditors->groupMember"."userId"`),
              {
                [db.Op.ne]: null,
              },
            ),
          ],
        },
      ],
    };
    const includeExpectation = expect.arrayContaining([
      expect.objectContaining({
        as: 'editors',
        where: {
          id: userId,
        },
        required: false,
      }),
      expect.objectContaining({
        as: 'groupEditors',
        include: [
          expect.objectContaining({
            as: 'groupMember',
            where: {
              userId,
              status: groupMemberStatus.accepted,
            },
          }),
        ],
        required: false,
      }),
    ]);
    beforeAll(() => {
      db.Vessel.findAllWithPaging.mockResolvedValue({
        ...mockAllVessel,
        rows: mockAllVessel.rows.map((row) => {
          return {
            editors: row.editors,
            groupEditors: row.groupEditors,
            toJSON: () => row,
          };
        }),
      });
    });
    afterAll(() => {
      db.Vessel.findAllWithPaging.mockReset();
    });
    it('should query vessels that are either owned by the user, or user is editor or member of group that has editor access to the vessels', async () => {
      const result = await getUserVessels(paging, userId);

      expect(result).toEqual({
        count: mockAllVessel.count,
        rows: mockAllVessel.rows.map((row) => {
          return { ...row, isEditor: expect.any(Boolean) };
        }),
        page: mockAllVessel.page,
        size: mockAllVessel.size,
      });
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: includeExpectation,
          replacements: {
            userId,
          },
          where: defaultWhereExpectation,
          subQuery: false,
        },
        paging,
      );
    });

    it('should add iLike queries on publicName and model when provided with non-empty query', async () => {
      const queriedPaging = { ...paging, query: 'test' };
      const result = await getUserVessels(queriedPaging, userId);

      expect(result).toEqual({
        count: mockAllVessel.count,
        rows: mockAllVessel.rows.map((row) => {
          return { ...row, isEditor: expect.any(Boolean) };
        }),
        page: mockAllVessel.page,
        size: mockAllVessel.size,
      });
      expect(db.Vessel.findAllWithPaging).toHaveBeenCalledWith(
        {
          include: includeExpectation,
          replacements: {
            userId,
          },
          where: {
            ...defaultWhereExpectation,
            [db.Op.or]: expect.arrayContaining([
              {
                publicName: {
                  [db.Op.iLike]: `%${queriedPaging.query}%`,
                },
              },
              {
                model: {
                  [db.Op.iLike]: `%${queriedPaging.query}%`,
                },
              },
            ]),
          },
          subQuery: false,
        },
        queriedPaging,
      );
    });
  });

  describe('getBulkVesselEditors', () => {
    it('should return editors and group editors of vessels', async () => {
      const vesselIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      const vesselEditors = [
        {
          vesselId: vesselIds[0],
          user: {
            id: uuid.v4(),
            name: faker.name.findName(),
            avatar: faker.random.numeric(2),
          },
        },
        {
          vesselId: vesselIds[1],
          user: {
            id: uuid.v4(),
            name: faker.name.findName(),
            avatar: faker.random.numeric(2),
          },
        },
        {
          vesselId: vesselIds[0],
          user: {
            id: uuid.v4(),
            name: faker.name.findName(),
            avatar: faker.random.numeric(2),
          },
        },
      ];
      const groupEditors = [
        {
          vesselId: vesselIds[0],
          group: {
            id: uuid.v4(),
            groupName: faker.name.findName(),
            groupImage: faker.internet.url(),
          },
        },
        {
          vesselId: vesselIds[1],
          group: {
            id: uuid.v4(),
            groupName: faker.name.findName(),
            groupImage: faker.internet.url(),
          },
        },
        {
          vesselId: vesselIds[2],
          group: {
            id: uuid.v4(),
            groupName: faker.name.findName(),
            groupImage: faker.internet.url(),
          },
        },
      ];
      db.VesselEditor.findAll.mockResolvedValueOnce(vesselEditors);
      db.VesselGroupEditor.findAll.mockResolvedValueOnce(groupEditors);

      const result = await getBulkVesselEditors(vesselIds);

      expect(result).toEqual(
        expect.objectContaining({
          [vesselIds[0]]: {
            editors: [vesselEditors[0].user, vesselEditors[2].user],
            groupEditors: [groupEditors[0].group],
          },
          [vesselIds[1]]: {
            editors: [vesselEditors[1].user],
            groupEditors: [groupEditors[1].group],
          },
          [vesselIds[2]]: {
            editors: [],
            groupEditors: [groupEditors[2].group],
          },
        }),
      );
      expect(db.VesselEditor.findAll).toHaveBeenCalledWith({
        where: {
          vesselId: {
            [db.Op.in]: vesselIds,
          },
        },
        include: [
          expect.objectContaining({
            as: 'user',
            attributes: expect.arrayContaining(['id', 'name', 'avatar']),
          }),
        ],
      });
    });
  });

  describe('getUserDefaultVessel', () => {
    it('should return vessel of user that has isDefaultVessel value set to true', async () => {
      const userId = uuid.v4();
      const mockVessel = {
        id: uuid.v4(),
        publicName: `Vessel of ${faker.name.findName()}`,
        lengthInMeters: faker.datatype.number({ max: 100 }),
        createdById: userId,
        isDefaultVessel: true,
      };
      db.Vessel.findOne.mockResolvedValueOnce({ toJSON: () => mockVessel });

      const result = await getUserDefaultVessel(userId);

      expect(result).toEqual(mockVessel);
      expect(db.Vessel.findOne).toHaveBeenCalledWith({
        where: {
          createdById: userId,
          isDefaultVessel: true,
        },
        include: defaultIncludeExpectation,
      });
    });
  });

  describe('setAsDefaultVessel', () => {
    it('should set isDefaultVessel of all user vessel to false, and update one selected vessel to true', async () => {
      const userId = uuid.v4();
      const vesselId = uuid.v4();
      db.Vessel.update.mockResolvedValueOnce([10]);
      db.Vessel.update.mockResolvedValueOnce([1]);

      const result = await setAsDefaultVessel(
        vesselId,
        userId,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.Vessel.update).toHaveBeenCalledWith(
        {
          isDefaultVessel: false,
        },
        {
          where: {
            createdById: userId,
            isDefaultVessel: true,
          },
          transaction: mockTransaction,
        },
      );
      expect(db.Vessel.update).toHaveBeenLastCalledWith(
        {
          isDefaultVessel: true,
        },
        {
          where: {
            id: vesselId,
          },
          transaction: mockTransaction,
        },
      );
    });

    it('should do nothing and return null when not provided with either vesselId or userId', async () => {
      const result = await setAsDefaultVessel(
        uuid.v4(),
        undefined,
        mockTransaction,
      );

      expect(result).toEqual(null);
      expect(db.Vessel.update).not.toHaveBeenCalled();
    });
  });

  describe('getVesselParticipants', () => {
    const vesselIds = Array(4)
      .fill()
      .map(() => uuid.v4());
    const mockVPs = vesselIds.map((vesselId) => {
      return {
        id: uuid.v4(),
        vesselId,
      };
    });
    it('should return vessel participants of vessel', async () => {
      db.VesselParticipant.findAll.mockResolvedValueOnce(
        mockVPs.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getVesselParticipants(vesselIds);

      expect(result).toEqual(mockVPs);
      expect(db.VesselParticipant.findAll).toHaveBeenCalledWith({
        where: {
          vesselId: {
            [db.Op.in]: vesselIds,
          },
        },
        order: [['vesselId', 'asc']],
        include: [
          expect.objectContaining({
            as: 'group',
          }),
        ],
      });
    });
    it('should convert input to array and findAll with single data array', async () => {
      const expectedVP = mockVPs.filter((row) => row.vesselId === vesselIds[0]);
      db.VesselParticipant.findAll.mockResolvedValueOnce(
        expectedVP.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getVesselParticipants(vesselIds[0]);

      expect(result).toEqual(expectedVP);
      expect(db.VesselParticipant.findAll).toHaveBeenCalledWith({
        where: {
          vesselId: {
            [db.Op.in]: [vesselIds[0]],
          },
        },
        order: [['vesselId', 'asc']],
        include: [
          expect.objectContaining({
            as: 'group',
          }),
        ],
      });
    });
  });
});
