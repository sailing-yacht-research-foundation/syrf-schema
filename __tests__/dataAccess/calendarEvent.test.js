const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  upsert,
  update,
  getAll,
  getById,
  getByIds,
  getCompetitionUnitsById,
  getParticipantsById,
  getAdminsById,
  validateAdminsById,
  delete: deleteEvent,
  addOpenGraph,
  addUsersAsEditor,
  removeUsersFromEditor,
  getEventEditors,
  getUserEvents,
  getByScrapedOriginalIdAndSource,
  clearGroupAdmins,
  getBulkEventEditors,
  getEventForScheduler,
  bulkUpdate,
  getRelatedFiles,
  getUntrackedEvents,
} = require('../../dataAccess/v1/calendarEvent');
const dal = require('../../dataAccess/v1/calendarEvent');

const {
  calendarEventStatus,
  dataSources,
  conversionValues,
  groupMemberStatus,
  participantInvitationStatus,
  competitionUnitStatus,
} = require('../../enums');

const db = require('../../index');
const {
  emptyPagingResponse,
  removeDomainFromUrl,
} = require('../../utils/utils');

const competitionUnitDAL = require('../../dataAccess/v1/competitionUnit');
const vesselParticipantGroupDAL = require('../../dataAccess/v1/vesselParticipantGroup');
const vesselParticipantDAL = require('../../dataAccess/v1/vesselParticipant');
const participantDAL = require('../../dataAccess/v1/participant');
const courseDAL = require('../../dataAccess/v1/course');

jest.mock('../../dataAccess/v1/competitionUnit');
jest.mock('../../dataAccess/v1/vesselParticipantGroup');
jest.mock('../../dataAccess/v1/vesselParticipant');
jest.mock('../../dataAccess/v1/participant');
jest.mock('../../dataAccess/v1/course');

describe('Calendar Event DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  const mockCalendarEvent = {
    id: uuid.v4(),
    name: `Event ${faker.random.word()}`,
    location: {
      crs: {
        type: 'name',
        properties: { name: 'EPSG:4326' },
      },
      type: 'Point',
      coordinates: [
        Number(faker.address.longitude()),
        Number(faker.address.latitude()),
      ],
    },
    isOpen: true,
    isPrivate: false,
    isSimulation: false,
    approximateEndTime_utc: new Date(),
    ownerId: uuid.v4(),
    allowRegistration: true,
    status: calendarEventStatus.ONGOING,
    source: dataSources.SYRF,
    isCrewed: false,
    requireCovidCertificate: false,
    requiredCertifications: [],
    requireEmergencyContact: false,
    requireImmigrationInfo: false,
    requireMedicalProblems: false,
    requireFoodAllergies: false,
    openGraphImage: `${faker.internet.url()}/og.jpg`,
    noticeOfRacePDF: `${faker.internet.url()}/calendar-events/noticeOfRacePDF/file.pdf`,
    mediaWaiverPDF: `${faker.internet.url()}/calendar-events/mediaWaiverPDF/file.pdf`,
    disclaimerPDF: `${faker.internet.url()}/calendar-events/disclaimerPDF/file.pdf`,
    scrapedOriginalId: null,
  };
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'editors',
    }),
    expect.objectContaining({
      as: 'groupEditors',
      include: [
        expect.objectContaining({
          as: 'groupMember',
          include: [
            expect.objectContaining({
              as: 'member',
            }),
          ],
          where: {
            status: groupMemberStatus.accepted,
          },
        }),
      ],
    }),
    expect.objectContaining({
      as: 'owner',
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
      db.CalendarEvent.upsert.mockImplementation(
        async (detail, _transaction) => {
          return [
            {
              toJSON: () => {
                return { ...detail };
              },
              setEditors: jest.fn(),
            },
            true,
          ];
        },
      );
    });
    afterAll(() => {
      db.CalendarEvent.upsert.mockReset();
    });
    it('should call upsert on CalendarEvent, generate random uuid when not provided', async () => {
      const data = {
        ...mockCalendarEvent,
        id: undefined,
        editors: [{ id: uuid.v4() }],
      };
      const result = await upsert(undefined, data, mockTransaction);

      expect(result).toEqual({ ...data, id: expect.any(String) });
      expect(db.CalendarEvent.upsert).toHaveBeenCalledWith(
        { ...data, id: expect.any(String) },
        {
          transaction: mockTransaction,
        },
      );
    });
    it('should call upsert on CalendarEvent, use provided id if exist', async () => {
      const data = {
        ...mockCalendarEvent,
        id: undefined,
      };
      const result = await upsert(mockCalendarEvent.id, data, mockTransaction);

      expect(result).toEqual(mockCalendarEvent);
      expect(db.CalendarEvent.upsert).toHaveBeenCalledWith(mockCalendarEvent, {
        transaction: mockTransaction,
      });
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      await upsert(mockCalendarEvent.id);

      expect(db.CalendarEvent.upsert).toHaveBeenCalledWith(
        { id: mockCalendarEvent.id },
        { transaction: undefined },
      );
    });
  });

  describe('update', () => {
    it('should call update on CalendarEvent and return update count', async () => {
      db.CalendarEvent.update.mockResolvedValueOnce([1, undefined]);
      const dataUpdate = {
        requireEmergencyContact: true,
        requireImmigrationInfo: true,
        requireMedicalProblems: true,
      };

      const result = await update(
        mockCalendarEvent.id,
        dataUpdate,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.CalendarEvent.update).toHaveBeenCalledWith(dataUpdate, {
        where: {
          id: mockCalendarEvent.id,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getAll', () => {
    const userId = uuid.v4();
    const mockEvents = [{ ...mockCalendarEvent }];
    beforeAll(() => {
      db.CalendarEvent.findAllWithPaging.mockResolvedValue({
        count: mockEvents.length,
        rows: mockEvents.map((row) => {
          return {
            get: () => row,
          };
        }),
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      });
    });
    afterAll(() => {
      db.CalendarEvent.findAllWithPaging.mockReset();
    });
    it('should find all event created by a user', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const params = { userId, private: false, isOpen: true };

      const result = await getAll(paging, params);

      expect(result.rows).toEqual(
        mockEvents.map((row) => {
          const { location, ...otherData } = row;
          return expect.objectContaining({
            ...otherData,
            lon: location.coordinates[0],
            lat: location.coordinates[1],
          });
        }),
      );
      expect(db.CalendarEvent.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdById: params.userId,
            isOpen: params.isOpen,
            isPrivate: params.private,
            [db.Op.or]: [
              {
                name: {
                  [db.Op.iLike]: `%${paging.query}%`,
                },
              },
              {
                locationName: {
                  [db.Op.iLike]: `%${paging.query}%`,
                },
              },
            ],
          },
        }),
        paging,
      );
    });
    it('should find all event sorted by location when provided with position param and use Nearest Neighbor Searching', async () => {
      const paging = { page: 1, size: 10 };
      const params = {
        radius: 1,
        position: [
          Number(faker.address.longitude()),
          Number(faker.address.latitude()),
        ],
      };

      await getAll(paging, params);

      expect(db.CalendarEvent.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: {
            include: [
              [
                db.Sequelize.fn(
                  'ST_DistanceSphere',
                  db.Sequelize.literal('"location"'),
                  db.Sequelize.literal(`ST_MakePoint(:lon, :lat)`),
                ),
                'distance',
              ],
            ],
          },
          where: {
            [db.Op.and]: [
              db.Sequelize.where(
                db.Sequelize.fn(
                  'ST_DistanceSphere',
                  db.Sequelize.literal('"location"'),
                  db.Sequelize.literal(`ST_MakePoint(:lon, :lat)`),
                ),
                {
                  [db.Op.lte]:
                    params.radius * conversionValues.nauticalMilesToMeters,
                },
              ),
            ],
          },
          replacements: { lon: params.position[0], lat: params.position[1] },
          order: [
            [
              db.Sequelize.literal(
                `"location" <-> 'SRID=4326;POINT(:lon :lat)'::geometry`,
              ),
            ],
          ],
        }),
        paging,
      );
    });
    it('should not fetch to DB and return empty response if provided with filter without any params', async () => {
      const paging = { page: 1, size: 10 };
      const result = await getAll(paging);

      expect(result).toEqual(emptyPagingResponse(paging));
      expect(db.CalendarEvent.findAllWithPaging).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should findByPk calendarEventId', async () => {
      const groupId = uuid.v4();
      const mockedData = {
        ...mockCalendarEvent,
        groupEditors: [
          {
            id: groupId,
            groupName: faker.name.findName(),
            groupImage: faker.internet.url(),
            groupMember: [
              {
                userId: uuid.v4(),
                member: {
                  name: faker.name.findName(),
                  avatar: faker.random.numeric(2),
                },
                groupId,
              },
            ],
          },
        ],
        editors: [],
      };
      db.CalendarEvent.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return mockedData;
        },
      });

      const result = await getById(mockCalendarEvent.id);

      expect(result).toEqual(
        expect.objectContaining({
          id: mockedData.id,
          name: mockedData.name,
          lon: mockedData.location.coordinates[0],
          lat: mockedData.location.coordinates[1],
          editors: expect.arrayContaining([
            {
              id: mockedData.groupEditors[0].groupMember[0].userId,
              name: mockedData.groupEditors[0].groupMember[0].member.name,
              avatar: mockedData.groupEditors[0].groupMember[0].member.avatar,
              fromGroup: true,
              groupId: mockedData.groupEditors[0].groupMember[0].groupId,
            },
          ]),
          groups: expect.arrayContaining([
            {
              id: mockedData.groupEditors[0].id,
              groupName: mockedData.groupEditors[0].groupName,
              groupImage: mockedData.groupEditors[0].groupImage,
            },
          ]),
        }),
      );
      expect(db.CalendarEvent.findByPk).toHaveBeenCalledWith(
        mockCalendarEvent.id,
        {
          include: defaultIncludeExpectation,
          transaction: undefined,
        },
      );
    });
    it('should return value and skip data transformation if not found', async () => {
      db.CalendarEvent.findByPk.mockResolvedValueOnce(undefined);
      const result = await getById(uuid.v4());

      expect(result).toEqual(undefined);
      expect(db.CalendarEvent.findByPk).toHaveBeenCalledTimes(1);
    });
    it('should return null and skip db query if provided with falsy id', async () => {
      const result = await getById();

      expect(result).toEqual(null);
      expect(db.CalendarEvent.findByPk).not.toHaveBeenCalled();
    });
  });

  describe('getByIds', () => {
    it('should find all event within provided id list', async () => {
      const ids = [uuid.v4()];
      const attributes = ['id', 'name'];
      await getByIds(ids, attributes);

      expect(db.CalendarEvent.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: ids,
          },
        },
        attributes,
        raw: true,
      });
    });
    it('should return empty array and skip db query when not provided with array of id', async () => {
      const result = await getByIds(undefined, []);

      expect(result).toEqual([]);
      expect(db.CalendarEvent.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getCompetitionUnitsById', () => {
    it('should find all competition of an event and append atttribute values', async () => {
      const id = uuid.v4();
      const params = {
        attributes: ['isOpen', 'allowRegistration'],
      };
      await getCompetitionUnitsById(id, params);

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          calendarEventId: id,
        },
        attributes: expect.arrayContaining([
          'id',
          'name',
          'startTime',
          ...params.attributes,
        ]),
        raw: true,
        transaction: undefined,
      });
    });
    it('should use default attributes if not provided', async () => {
      const id = uuid.v4();
      await getCompetitionUnitsById(id);

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          calendarEventId: id,
        },
        attributes: ['id', 'name', 'startTime'],
        raw: true,
        transaction: undefined,
      });
    });
    it('should return null and skip db query when provided with falsy id', async () => {
      const result = await getCompetitionUnitsById();

      expect(result).toEqual(null);
      expect(db.CompetitionUnit.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getParticipantsById', () => {
    it('should find all participant of an event', async () => {
      const id = uuid.v4();
      await getParticipantsById(id);

      expect(db.Participant.findAll).toHaveBeenCalledWith({
        where: {
          calendarEventId: id,
        },
        attributes: [
          'id',
          'publicName',
          'invitationStatus',
          'allowShareInformation',
          'vesselId',
          'sailNumber',
          'trackerDistanceToBow',
          'userProfileId',
        ],
        raw: true,
        transaction: undefined,
      });
    });
    it('should return null and skip db query when provided with falsy id', async () => {
      const result = await getParticipantsById();

      expect(result).toEqual(null);
      expect(db.Participant.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getAdminsById', () => {
    const mockedData = {
      ...mockCalendarEvent,
      groupEditors: [
        {
          groupMember: [
            {
              userId: uuid.v4(),
              member: {
                name: faker.name.findName(),
                avatar: faker.random.numeric(2),
              },
            },
          ],
        },
      ],
      editors: [
        {
          id: uuid.v4(),
          name: faker.name.findName(),
          avatar: faker.random.numeric(2),
        },
      ],
    };
    beforeAll(() => {
      db.CalendarEvent.findByPk.mockResolvedValue({
        toJSON: () => mockedData,
      });
    });
    afterAll(() => {
      db.CalendarEvent.findByPk.mockReset();
    });
    it('should find all editors of an event', async () => {
      const params = { includeAttributes: ['isPrivate'] };
      const result = await getAdminsById(mockedData.id, params);

      expect(db.CalendarEvent.findByPk).toHaveBeenCalledWith(mockedData.id, {
        include: defaultIncludeExpectation,
        attributes: expect.arrayContaining([
          'id',
          'name',
          'isOpen',
          'ownerId',
          'status',
          'isPrivate',
        ]),
        transaction: undefined,
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: mockedData.id,
          name: mockedData.name,
          status: mockedData.status,
          editors: expect.arrayContaining([
            expect.objectContaining({
              id: mockedData.groupEditors[0].groupMember[0].userId,
              name: mockedData.groupEditors[0].groupMember[0].member.name,
            }),
            expect.objectContaining({
              id: mockedData.editors[0].id,
              name: mockedData.editors[0].name,
            }),
          ]),
        }),
      );
    });
    it('should return undefined and skip transforming if data not found', async () => {
      db.CalendarEvent.findByPk.mockResolvedValue(undefined);
      const result = await getAdminsById(uuid.v4());

      expect(result).toEqual(undefined);
    });
    it('should return null and skip db query when provided with falsy id', async () => {
      const result = await getAdminsById();

      expect(result).toEqual(null);
      expect(db.CalendarEvent.findByPk).not.toHaveBeenCalled();
    });
  });

  describe('validateAdminsById', () => {
    let spyGetAdmins = jest.spyOn(dal, 'getAdminsById');
    const mockedData = {
      ...mockCalendarEvent,
      owner: {
        id: mockCalendarEvent.ownerId,
      },
      editors: [
        {
          id: uuid.v4(),
          name: faker.name.findName(),
          avatar: faker.random.numeric(2),
        },
      ],
    };
    beforeAll(() => {
      spyGetAdmins.mockResolvedValue(mockedData);
    });
    afterAll(() => {
      spyGetAdmins.mockReset();
    });
    it('should return isOwner true if requested user id is equal to owner id', async () => {
      spyGetAdmins.mockResolvedValueOnce({ ...mockedData, editors: [] });
      const result = await validateAdminsById(
        mockedData.id,
        mockedData.ownerId,
      );

      expect(result).toEqual({
        isOwner: true,
        isEditor: false,
        event: { ...mockedData, editors: [] },
      });
    });
    it('should return isEditor true if requested user id is included in editors array', async () => {
      const result = await validateAdminsById(
        mockedData.id,
        mockedData.editors[0].id,
      );

      expect(result).toEqual({
        isOwner: false,
        isEditor: true,
        event: mockedData,
      });
    });
    it('should return default bool values if getAdminsById found nothing', async () => {
      spyGetAdmins.mockResolvedValueOnce(undefined);
      const result = await validateAdminsById(uuid.v4(), uuid.v4());

      expect(result).toEqual({
        isOwner: false,
        isEditor: false,
        event: undefined,
      });
      expect(spyGetAdmins).toHaveBeenCalledWith(expect.any(String), {});
    });
    it('should return default bool values if userId is not provided', async () => {
      const result = await validateAdminsById(mockedData.id);

      expect(result).toEqual({
        isOwner: false,
        isEditor: false,
        event: mockedData,
      });
      expect(spyGetAdmins).toHaveBeenCalledWith(mockedData.id, {});
    });
    it('should return null if provided with falsy id', async () => {
      const result = await validateAdminsById(undefined, uuid.v4());

      expect(result).toEqual(null);
      expect(spyGetAdmins).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should destroy all related data from event', async () => {
      db.CalendarEvent.findByPk.mockResolvedValueOnce({
        toJSON: () => mockCalendarEvent,
      });
      const mockVpgs = [{ id: uuid.v4() }];
      db.VesselParticipantGroup.findAll.mockResolvedValueOnce(mockVpgs);
      const mockVps = [{ id: uuid.v4() }];
      db.VesselParticipant.findAll.mockResolvedValueOnce(mockVps);

      const mockCompetitions = [{ id: uuid.v4() }];
      db.CompetitionUnit.findAll.mockResolvedValueOnce(mockCompetitions);
      const mockParticipants = [{ id: uuid.v4() }];
      db.Participant.findAll.mockResolvedValueOnce(mockParticipants);
      const mockCourses = [{ id: uuid.v4() }];
      db.Course.findAll.mockResolvedValueOnce(mockCourses);

      const result = await deleteEvent(mockCalendarEvent.id, mockTransaction);

      expect(result).toEqual(mockCalendarEvent);
      [
        db.CompetitionUnit.findAll,
        db.VesselParticipantGroup.findAll,
        db.Participant.findAll,
        db.Course.findAll,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              calendarEventId: mockCalendarEvent.id,
            },
            attributes: ['id'],
            raw: true,
          }),
        );
      });
      expect(db.VesselParticipant.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vesselParticipantGroupId: {
              [db.Op.in]: mockVpgs.map((t) => t.id),
            },
          },
          raw: true,
        }),
      );
      [
        competitionUnitDAL.delete,
        vesselParticipantGroupDAL.delete,
        vesselParticipantDAL.delete,
        participantDAL.delete,
        courseDAL.delete,
      ].forEach((dalFunc) => {
        expect(dalFunc).toHaveBeenCalledTimes(1);
      });
      [db.CalendarGroupEditor.destroy, db.TrackHistory.destroy].forEach(
        (dbFunc) => {
          expect(dbFunc).toHaveBeenCalledWith({
            where: {
              calendarEventId: mockCalendarEvent.id,
            },
            transaction: mockTransaction,
          });
        },
      );
      expect(db.CalendarEditor.destroy).toHaveBeenCalledWith({
        where: {
          CalendarEventId: mockCalendarEvent.id,
        },
        transaction: mockTransaction,
      });
      expect(db.CalendarEvent.destroy).toHaveBeenCalledWith({
        where: {
          id: mockCalendarEvent.id,
        },
        transaction: mockTransaction,
      });
      expect(db.Vessel.destroy).toHaveBeenCalledWith({
        where: {
          scope: mockCalendarEvent.id,
        },
        force: true,
        transaction: mockTransaction,
      });
    });
    it('should skip deletion if event is not found', async () => {
      db.CalendarEvent.findByPk.mockResolvedValueOnce(undefined);

      const result = await deleteEvent(uuid.v4(), mockTransaction);

      expect(result).toEqual(undefined);
      expect(db.VesselParticipant.findAll).not.toHaveBeenCalled();
    });
  });

  describe('addOpenGraph', () => {
    it('should update CalendarEvent openGraphImage column', async () => {
      const openGraphImage = faker.internet.url();
      await addOpenGraph(mockCalendarEvent.id, openGraphImage);

      expect(db.CalendarEvent.update).toHaveBeenCalledWith(
        { openGraphImage },
        {
          where: {
            id: mockCalendarEvent.id,
          },
        },
      );
    });
  });

  describe('addUsersAsEditor', () => {
    it('should bulkCreate CalendarEditor', async () => {
      const users = Array(5)
        .fill()
        .map(() => uuid.v4());
      const calendarEventId = uuid.v4();

      await addUsersAsEditor(calendarEventId, users, mockTransaction);

      expect(db.CalendarEditor.bulkCreate).toHaveBeenCalledWith(
        users.map((row) => {
          return { UserProfileId: row, CalendarEventId: calendarEventId };
        }),
        {
          ignoreDuplicates: true,
          validate: true,
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('removeUsersFromEditor', () => {
    it('should destroy CalendarEditor', async () => {
      const users = Array(5)
        .fill()
        .map(() => uuid.v4());
      const calendarEventId = uuid.v4();
      db.CalendarEditor.destroy.mockResolvedValueOnce(users.length);

      const result = await removeUsersFromEditor(
        calendarEventId,
        users,
        mockTransaction,
      );

      expect(result).toEqual(users.length);
      expect(db.CalendarEditor.destroy).toHaveBeenCalledWith({
        where: {
          CalendarEventId: calendarEventId,
          UserProfileId: {
            [db.Op.in]: users,
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getEventEditors', () => {
    it('should return individual and group edtors', async () => {
      const calendarEventId = uuid.v4();
      await getEventEditors(calendarEventId);

      expect(db.CalendarEditor.findAll).toHaveBeenCalledWith({
        where: {
          CalendarEventId: calendarEventId,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'user',
            attributes: expect.arrayContaining(['id', 'name', 'avatar']),
          }),
        ]),
      });

      expect(db.CalendarGroupEditor.findAll).toHaveBeenCalledWith({
        where: {
          calendarEventId,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'group',
            attributes: expect.arrayContaining([
              'id',
              'groupName',
              'groupImage',
            ]),
          }),
        ]),
      });
    });
  });

  describe('getUserEvents', () => {
    const mockEvents = [
      { ...mockCalendarEvent, editors: [], participants: [] },
    ];
    beforeAll(() => {
      db.CalendarEvent.findAllWithPaging.mockResolvedValue({
        count: mockEvents.length,
        rows: mockEvents.map((row) => {
          return { toJSON: () => row };
        }),
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      });
    });
    afterAll(() => {
      db.CalendarEvent.findAllWithPaging.mockReset();
    });
    it('should query event owned/editable by user', async () => {
      const paging = { page: 1, size: 10 };
      const userId = mockCalendarEvent.ownerId;

      const result = await getUserEvents(paging, userId);

      expect(result.rows).toEqual(
        mockEvents.map((row) => {
          const { location, ...otherData } = row;
          return {
            ...otherData,
            lon: location.coordinates[0],
            lat: location.coordinates[1],
            isEditor: false,
            isParticipant: false,
          };
        }),
      );
      expect(db.CalendarEvent.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: { include: [] },
          include: expect.arrayContaining([
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
            expect.objectContaining({
              as: 'participants',
              where: {
                userProfileId: userId,
                invitationStatus: {
                  [db.Op.in]: [
                    participantInvitationStatus.ACCEPTED,
                    participantInvitationStatus.SELF_REGISTERED,
                  ],
                },
              },
              required: false,
            }),
          ]),
          replacements: {
            userId,
          },
          where: {
            [db.Op.and]: [
              {
                [db.Op.or]: [
                  { ownerId: userId },
                  db.Sequelize.where(db.Sequelize.literal(`"editors"."id"`), {
                    [db.Op.ne]: null,
                  }),
                  db.Sequelize.where(
                    db.Sequelize.literal(
                      `"groupEditors->groupMember"."userId"`,
                    ),
                    {
                      [db.Op.ne]: null,
                    },
                  ),
                  db.Sequelize.where(
                    db.Sequelize.literal(`"participants"."id"`),
                    {
                      [db.Op.ne]: null,
                    },
                  ),
                ],
              },
            ],
          },
          subQuery: false,
        },
        { ...paging, defaultSort: undefined },
      );
    });
    it('should add more condition based on parameters', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const parameters = {
        location: {
          lon: Number(faker.address.longitude()),
          lat: Number(faker.address.latitude()),
        },
      };
      const userId = mockCalendarEvent.ownerId;

      const result = await getUserEvents(paging, userId, parameters);

      expect(result.rows).toEqual(
        mockEvents.map((row) => {
          const { location, ...otherData } = row;
          return {
            ...otherData,
            lon: location.coordinates[0],
            lat: location.coordinates[1],
            isEditor: false,
            isParticipant: false,
          };
        }),
      );
      expect(db.CalendarEvent.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: {
            include: [
              [
                db.Sequelize.fn(
                  'ST_DistanceSphere',
                  db.Sequelize.literal('"location"'),
                  db.Sequelize.literal(`ST_MakePoint(:lon, :lat)`),
                ),
                'distance',
              ],
            ],
          },
          replacements: {
            userId,
            lon: parameters.location.lon,
            lat: parameters.location.lat,
          },
          where: expect.objectContaining({
            [db.Op.or]: [
              {
                name: {
                  [db.Op.iLike]: `%${paging.query}%`,
                },
              },
              {
                locationName: {
                  [db.Op.iLike]: `%${paging.query}%`,
                },
              },
            ],
          }),
          subQuery: false,
        }),
        {
          ...paging,
          defaultSort: [
            db.Sequelize.literal(
              `CASE WHEN "CalendarEvent"."status" in ('${calendarEventStatus.ONGOING}','${calendarEventStatus.SCHEDULED}') THEN 0 ELSE 1 END ASC`,
            ),
            [
              db.Sequelize.literal(
                `"location" <-> 'SRID=4326;POINT(:lon :lat)'::geometry`,
              ),
              'ASC',
            ],
          ],
        },
      );
    });
  });

  describe('getByScrapedOriginalIdAndSource', () => {
    it('should work with single id', async () => {
      const originalId = uuid.v4();
      const source = 'SAP';

      await getByScrapedOriginalIdAndSource(originalId, source);

      expect(db.CalendarEvent.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining(['id', 'scrapedOriginalId']),
        where: {
          scrapedOriginalId: originalId,
          source,
        },
      });
    });
    it('should work with array of id', async () => {
      const originalIds = [uuid.v4()];
      const source = 'SAP';

      await getByScrapedOriginalIdAndSource(originalIds, source);

      expect(db.CalendarEvent.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining(['id', 'scrapedOriginalId']),
        where: {
          scrapedOriginalId: {
            [db.Op.in]: originalIds,
          },
          source,
        },
      });
    });
  });

  describe('clearGroupAdmins', () => {
    it('should destroy CalendarGroupEditor', async () => {
      const calendarEventId = uuid.v4();
      db.CalendarGroupEditor.destroy.mockResolvedValueOnce(1);

      await clearGroupAdmins(calendarEventId, mockTransaction);
      expect(db.CalendarGroupEditor.destroy).toHaveBeenCalledWith(
        {
          where: {
            calendarEventId,
          },
        },
        { transaction: mockTransaction },
      );
    });
  });

  describe('getBulkEventEditors', () => {
    it('should fetch editors & group editors, then return an object with each calendar event id as keys, and editors as value', async () => {
      const calendarEventIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      const mockEditors = Array(6)
        .fill()
        .map((_row, index) => {
          const userId = uuid.v4();
          return {
            UserProfileId: userId,
            CalendarEventId: calendarEventIds[index % 2],
            user: {
              id: userId,
              name: faker.name.findName(),
              avatar: faker.random.numeric(2),
            },
          };
        });
      db.CalendarEditor.findAll.mockResolvedValueOnce(mockEditors);
      // Note: Just to cover if condition in group editors
      const mockGroupEditors = Array(9)
        .fill()
        .map((_row, index) => {
          const groupId = uuid.v4();
          return {
            groupId,
            calendarEventId: calendarEventIds[index % calendarEventIds.length],
            group: {
              id: groupId,
              name: `Group ${faker.name.findName()}`,
              groupImaage: faker.internet.url(),
            },
          };
        });
      db.CalendarGroupEditor.findAll.mockResolvedValueOnce(mockGroupEditors);

      const result = await getBulkEventEditors(calendarEventIds);

      calendarEventIds.forEach((calendarEventId) => {
        expect(result[calendarEventId]).toEqual({
          editors: mockEditors.reduce((arr, row) => {
            if (row.CalendarEventId === calendarEventId) {
              arr.push(row.user);
            }
            return arr;
          }, []),
          groupEditors: mockGroupEditors.reduce((arr, row) => {
            if (row.calendarEventId === calendarEventId) {
              arr.push(row.group);
            }
            return arr;
          }, []),
        });
      });
      expect(db.CalendarEditor.findAll).toHaveBeenCalledWith({
        where: {
          CalendarEventId: {
            [db.Op.in]: calendarEventIds,
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'user',
            attributes: expect.arrayContaining(['id', 'name', 'avatar']),
          }),
        ]),
      });
      expect(db.CalendarGroupEditor.findAll).toHaveBeenCalledWith({
        where: {
          calendarEventId: {
            [db.Op.in]: calendarEventIds,
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'group',
            attributes: expect.arrayContaining([
              'id',
              'groupName',
              'groupImage',
            ]),
          }),
        ]),
      });
    });
  });

  describe('getEventForScheduler', () => {
    it('should findAll on CalendarEvent and transform the return values', async () => {
      const mockedData = [
        {
          ...mockCalendarEvent,
          competitionUnit: [
            {
              id: uuid.v4(),
              name: `Competition #${faker.random.numeric(2)}`,
              status: competitionUnitStatus.ONGOING,
            },
          ],
        },
      ];
      db.CalendarEvent.findAll.mockResolvedValueOnce(mockedData);
      const filterDateStart = new Date();
      const statusArray = [calendarEventStatus.ONGOING];

      const result = await getEventForScheduler(statusArray, filterDateStart);

      expect(db.CalendarEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: db.CompetitionUnit,
              as: 'competitionUnit',
            }),
          ]),
          where: {
            status: {
              [db.Op.in]: statusArray,
            },
            approximateEndTime_utc: {
              [db.Op.lte]: filterDateStart,
            },
          },
          order: [['approximateEndTime_utc', 'ASC']],
        }),
      );
      expect(result).toEqual(
        mockedData.map((row) => {
          return expect.objectContaining({
            calendarEventId: row.id,
            calendarEventName: row.name,
            status: row.status,
            approximateEndTime_utc: row.approximateEndTime_utc,
            isSimulation: row.isSimulation,
            ownerId: row.ownerId,
            competitionUnits: row.competitionUnit.map((cUnit) => {
              const { id: competitionUnitId, status, name } = cUnit;
              return { competitionUnitId, status, name };
            }),
          });
        }),
      );
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple calendar event', async () => {
      const ids = [uuid.v4()];
      const data = { name: faker.name.findName() };
      db.CalendarEvent.update.mockResolvedValueOnce([1, undefined]);

      const result = await bulkUpdate(ids, data, mockTransaction);

      expect(result).toEqual(1);
      expect(db.CalendarEvent.update).toHaveBeenCalledWith(data, {
        where: {
          id: {
            [db.Op.in]: ids,
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getRelatedFiles', () => {
    const mockCompFiles = [
      {
        type: 'og_image',
        path: 'comp_og.jpg',
        bucket: 'opengraph_image',
      },
    ];
    const competitionUnits = [{ id: uuid.v4() }];
    const spyGetCompetitions = jest.spyOn(dal, 'getCompetitionUnitsById');
    const spyGetById = jest.spyOn(dal, 'getById');
    beforeAll(() => {
      competitionUnitDAL.getRelatedFiles.mockResolvedValue(mockCompFiles);
      spyGetCompetitions.mockResolvedValue(competitionUnits);
      spyGetById.mockResolvedValue(mockCalendarEvent);
    });
    afterAll(() => {
      competitionUnitDAL.getRelatedFiles.mockReset();
      spyGetCompetitions.mockReset();
      spyGetById.mockReset();
    });
    it('should query event details and competitions in it, and return all files', async () => {
      const calendarEventId = mockCalendarEvent.id;
      const result = await getRelatedFiles(calendarEventId);

      expect(result).toEqual(
        expect.arrayContaining([
          {
            type: 'og_image',
            path: removeDomainFromUrl(mockCalendarEvent.openGraphImage),
            bucket: 'opengraph_image',
          },
          {
            type: 'notice_of_race',
            path: removeDomainFromUrl(mockCalendarEvent.noticeOfRacePDF),
            bucket: 'avatar_bucket',
          },
          {
            type: 'media_waiver',
            path: removeDomainFromUrl(mockCalendarEvent.mediaWaiverPDF),
            bucket: 'avatar_bucket',
          },
          {
            type: 'event_disclaimer',
            path: removeDomainFromUrl(mockCalendarEvent.disclaimerPDF),
            bucket: 'avatar_bucket',
          },
          ...mockCompFiles.map((row) => {
            return { ...row, competitionUnitId: competitionUnits[0].id };
          }),
        ]),
      );
      expect(spyGetCompetitions).toHaveBeenCalledWith(
        calendarEventId,
        {},
        undefined,
      );
      expect(spyGetById).toHaveBeenCalledWith(calendarEventId, undefined);
      expect(competitionUnitDAL.getRelatedFiles).toHaveBeenCalledWith(
        competitionUnits[0].id,
        undefined,
      );
      expect(competitionUnitDAL.getRelatedFiles).toHaveBeenCalledTimes(
        competitionUnits.length,
      );
    });
    it('should still return competition files if no event files exist', async () => {
      spyGetById.mockResolvedValueOnce({
        ...mockCalendarEvent,
        openGraphImage: null,
        noticeOfRacePDF: null,
        mediaWaiverPDF: null,
        disclaimerPDF: null,
      });
      const calendarEventId = mockCalendarEvent.id;
      const result = await getRelatedFiles(calendarEventId);

      expect(result).toEqual(
        expect.arrayContaining([
          ...mockCompFiles.map((row) => {
            return { ...row, competitionUnitId: competitionUnits[0].id };
          }),
        ]),
      );
      expect(competitionUnitDAL.getRelatedFiles).toHaveBeenCalledWith(
        competitionUnits[0].id,
        undefined,
      );
      expect(competitionUnitDAL.getRelatedFiles).toHaveBeenCalledTimes(
        competitionUnits.length,
      );
    });
    it('should return empty array if no event detail can be queried', async () => {
      spyGetById.mockResolvedValueOnce(undefined);
      const result = await getRelatedFiles(uuid.v4());
      expect(result).toEqual([]);
      expect(competitionUnitDAL.getRelatedFiles).not.toHaveBeenCalled();
    });
  });

  describe('getUntrackedEvents', () => {
    it('should findAll to CalendarEvent with date queries, and transform the return value', async () => {
      const userId = uuid.v4();
      const mockedData = [
        {
          ...mockCalendarEvent,
          groupEditors: [
            {
              id: uuid.v4(),
              groupMember: [
                {
                  id: uuid.v4(),
                  userId,
                  member: {
                    id: userId,
                    name: faker.name.findName(),
                    avatar: faker.random.numeric(2),
                  },
                },
              ],
            },
          ],
          editors: [{ id: uuid.v4() }],
        },
      ];
      db.CalendarEvent.findAll.mockResolvedValueOnce(
        mockedData.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const filterTimeStart = new Date();
      const filterTimeEnd = new Date();
      const result = await getUntrackedEvents(filterTimeStart, filterTimeEnd);

      expect(result).toEqual(
        mockedData.map((row) => {
          const { editors, groupEditors, ownerId, ...otherData } = row;
          return {
            ...otherData,
            editors: [
              ownerId,
              ...editors.map((row) => row.id),
              ...groupEditors.map((row) => row.groupMember[0].userId),
            ],
          };
        }),
      );
      expect(db.CalendarEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            approximateStartTime_utc: {
              [db.Op.gte]: filterTimeStart,
              [db.Op.lt]: filterTimeEnd,
            },
            status: {
              [db.Op.in]: [
                calendarEventStatus.SCHEDULED,
                calendarEventStatus.ONGOING,
                calendarEventStatus.COMPLETED,
              ],
            },
            source: dataSources.SYRF,
            '$tracks.id$': null,
            isSimulation: false,
          },
          subQuery: false,
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'tracks',
              required: false,
            }),
            expect.objectContaining({
              as: 'editors',
            }),
            expect.objectContaining({
              as: 'groupEditors',
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'groupMember',
                  include: [
                    expect.objectContaining({
                      as: 'member',
                    }),
                  ],
                  where: {
                    status: groupMemberStatus.accepted,
                  },
                }),
              ]),
            }),
          ]),
        }),
      );
    });
    it('should skip transforming and return empty arra if no event found', async () => {
      db.CalendarEvent.findAll.mockResolvedValueOnce([]);
      const result = await getUntrackedEvents(new Date(), new Date());

      expect(result).toEqual([]);
    });
  });
});
