const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  upsert,
  getAll,
  getById,
  getByUserId,
  delete: deleteParticipant,
  getEvent,
  getRacesQuery,
  getRaces,
  getRacesWithoutPaging,
  getByUserAndEvent,
  findDuplicate,
  bulkCreate,
  bulkCreateWithOptions,
  updateUserlessParticipants,
  update,
  getInvitation,
  removeFromAllVesselParticipant,
  getAllWithoutPaging,
  getByUserAndRace,
  getAllWithShareableInfo,
  getByIdWithVaccineAndPassport,
} = require('../../dataAccess/v1/participant');
const {
  participantInvitationStatus,
  calendarEventStatus,
} = require('../../enums');

const db = require('../../index');
const { emptyPagingResponse, ValidationError } = require('../../utils/utils');

describe('Participant DAL', () => {
  const mockParticipant = {
    id: uuid.v4(),
    publicName: faker.name.findName(),
    trackerUrl: faker.internet.url(),
    calendarEventId: uuid.v4(),
    userProfileId: uuid.v4(),
    invitationStatus: participantInvitationStatus.ACCEPTED,
    allowShareInformation: false,
  };
  const mockTransaction = db.sequelize.transaction();
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'profile',
      attributes: expect.arrayContaining(['id', 'name']),
    }),
    expect.objectContaining({
      as: 'event',
      attributes: expect.arrayContaining(['id', 'name', 'isOpen']),
      include: [
        expect.objectContaining({
          as: 'editors',
          attributes: expect.arrayContaining(['id', 'name']),
        }),
        expect.objectContaining({
          as: 'owner',
          attributes: expect.arrayContaining(['id', 'name']),
        }),
      ],
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
      db.Participant.upsert.mockImplementation(async (detail, _transaction) => {
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
      db.Participant.upsert.mockReset();
    });
    it('should call upsert on Participant table and generate random uuid when not provided', async () => {
      const result = await upsert(
        null,
        { ...mockParticipant, id: undefined },
        mockTransaction,
      );

      expect(result).toEqual({
        ...mockParticipant,
        id: expect.any(String),
      });
      expect(db.Participant.upsert).toHaveBeenCalledWith(
        {
          ...mockParticipant,
          id: expect.any(String),
        },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on Participant table and use the provided uuid', async () => {
      const result = await upsert(mockParticipant.id, mockParticipant);

      expect(result).toEqual(mockParticipant);
      expect(db.Participant.upsert).toHaveBeenCalledWith(
        mockParticipant,
        undefined,
      );
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const participantId = uuid.v4();

      const result = await upsert(participantId);

      expect(result).toEqual({ id: participantId });
      expect(db.Participant.upsert).toHaveBeenCalledWith(
        { id: participantId },
        undefined,
      );
    });
  });

  describe('getAll', () => {
    beforeAll(() => {
      db.Participant.findAllWithPaging.mockResolvedValue([]);
    });
    afterAll(() => {
      db.Participant.findAllWithPaging.mockReset();
    });
    it('should findAllWithPaging to Participant with calendarEventId if specified in params, that has not been assigned to a vp yet', async () => {
      const paging = { page: 1, size: 10, query: '' };
      const params = {
        calendarEventId: uuid.v4(),
        invitationStatus: [
          participantInvitationStatus.ACCEPTED,
          participantInvitationStatus.SELF_REGISTERED,
        ],
        assigned: false,
      };

      const result = await getAll(paging, params);

      expect(result).toEqual([]);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            calendarEventId: params.calendarEventId,
            invitationStatus: {
              [db.Op.in]: [
                participantInvitationStatus.ACCEPTED,
                participantInvitationStatus.SELF_REGISTERED,
              ],
            },
            ['$vesselParticipants.id$']: {
              [db.Op.is]: null,
            },
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipants',
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantId',
                'vesselId',
                'vesselParticipantGroupId',
              ]),
            }),
            expect.objectContaining({
              required: false,
              as: 'vesselParticipants',
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantId',
                'vesselId',
                'vesselParticipantGroupId',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'vessel',
                  attributes: expect.arrayContaining([
                    'id',
                    'vesselId',
                    'globalId',
                    'publicName',
                    'scope',
                    'bulkCreated',
                  ]),
                  paranoid: false,
                }),
                expect.objectContaining({
                  as: 'group',
                  attributes: expect.arrayContaining([
                    'id',
                    'vesselParticipantGroupId',
                    'name',
                  ]),
                }),
              ]),
            }),
            expect.objectContaining({
              as: 'profile',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'country',
                'avatar',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'participationCharge',
                  required: false,
                  attributes: ['paymentDate', 'checkoutSessionId'],
                  where: {
                    calendarEventId: params.calendarEventId,
                  },
                }),
              ]),
            }),
          ]),
          subQuery: false,
        },
        paging,
      );
    });
    it('should findAllWithPaging to Participant that been assigned to a vp, and add like condition when provided with query', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const params = {
        calendarEventId: uuid.v4(),
        assigned: true,
      };

      const result = await getAll(paging, params);

      expect(result).toEqual([]);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            calendarEventId: params.calendarEventId,
            publicName: { [db.Op.like]: '%test%' },
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipants',
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantId',
                'vesselId',
                'vesselParticipantGroupId',
              ]),
            }),
            expect.objectContaining({
              required: true,
              as: 'vesselParticipants',
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantId',
                'vesselId',
                'vesselParticipantGroupId',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'vessel',
                  attributes: expect.arrayContaining([
                    'id',
                    'vesselId',
                    'globalId',
                    'publicName',
                    'scope',
                    'bulkCreated',
                  ]),
                  paranoid: false,
                }),
                expect.objectContaining({
                  as: 'group',
                  attributes: expect.arrayContaining([
                    'id',
                    'vesselParticipantGroupId',
                    'name',
                  ]),
                }),
              ]),
            }),
            expect.objectContaining({
              as: 'profile',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'country',
                'avatar',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'participationCharge',
                  required: false,
                  attributes: ['paymentDate', 'checkoutSessionId'],
                  where: {
                    calendarEventId: params.calendarEventId,
                  },
                }),
              ]),
            }),
          ]),
        },
        paging,
      );
    });
    it('should findAllWithPaging to Participant which created by the user if provided with userId', async () => {
      const paging = { page: 1, size: 10, query: '' };
      const params = {
        userId: uuid.v4(),
      };

      const result = await getAll(paging, params);

      expect(result).toEqual([]);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            createdById: params.userId,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipants',
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantId',
                'vesselId',
                'vesselParticipantGroupId',
              ]),
            }),
          ]),
        },
        paging,
      );
    });
    it('should not fetch to DB and return empty response if provided with filter without calendar event or user id', async () => {
      const paging = {
        query: '',
        page: 1,
        size: 10,
      };
      const result = await getAll(paging, {});

      expect(result).toEqual(emptyPagingResponse(paging));
      expect(db.Participant.findAllWithPaging).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should findByPk to Participant table', async () => {
      db.Participant.findByPk.mockResolvedValueOnce({
        toJSON: () => mockParticipant,
      });
      const result = await getById(mockParticipant.id);

      expect(result).toEqual(mockParticipant);
      expect(db.Participant.findByPk).toHaveBeenCalledWith(mockParticipant.id, {
        include: defaultIncludeExpectation,
      });
    });
  });

  describe('getByUserId', () => {
    it('should findAllWithPaging to Participant table based on the user', async () => {
      const paging = { page: 1, size: 10, query: '' };
      const userId = uuid.v4();
      db.Participant.findAllWithPaging.mockResolvedValueOnce([]);
      const result = await getByUserId(userId, paging);

      expect(result).toEqual([]);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            userProfileId: userId,
            invitationStatus: {
              [db.Op.in]: [
                participantInvitationStatus.ACCEPTED,
                participantInvitationStatus.SELF_REGISTERED,
              ],
            },
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'event',
            }),
          ]),
        },
        paging,
      );
    });
    it('should findAllWithPaging to Participant table based on the user and require the isPrivate condition if provided', async () => {
      const paging = { page: 1, size: 10, query: '' };
      const userId = uuid.v4();
      const isPrivate = false;
      db.Participant.findAllWithPaging.mockResolvedValueOnce([]);

      const result = await getByUserId(userId, paging, isPrivate);

      expect(result).toEqual([]);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            userProfileId: userId,
            invitationStatus: {
              [db.Op.in]: [
                participantInvitationStatus.ACCEPTED,
                participantInvitationStatus.SELF_REGISTERED,
              ],
            },
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'event',
              required: true,
              where: {
                isPrivate,
              },
            }),
          ]),
        },
        paging,
      );
    });
  });

  describe('delete', () => {
    it('should destroy Participant, VesselParticipantCrew, and CrewTrackJson of the deleted participant, and return the deleted participant detail if not a multi-delete request', async () => {
      db.Participant.findByPk.mockResolvedValueOnce({
        toJSON: () => mockParticipant,
      });
      const mockCrews = [{ id: uuid.v4() }];
      db.VesselParticipantCrew.findAll.mockResolvedValueOnce(mockCrews);
      db.Participant.destroy.mockResolvedValueOnce(1);

      const result = await deleteParticipant(
        mockParticipant.id,
        mockTransaction,
      );

      expect(result).toEqual(mockParticipant);
      expect(db.Participant.findByPk).toHaveBeenCalledWith(
        mockParticipant.id,
        expect.objectContaining({
          include: defaultIncludeExpectation,
        }),
      );
      expect(db.VesselParticipantCrew.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participantId: {
              [db.Op.in]: [mockParticipant.id],
            },
          },
          attributes: expect.arrayContaining(['id']),
        }),
      );
      expect(db.Participant.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: [mockParticipant.id],
          },
        },
      });
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledWith({
        where: {
          participantId: {
            [db.Op.in]: [mockParticipant.id],
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
    it('should skip fetching detail, and return the deleted participant count if a multi-delete request', async () => {
      const mockCrews = [{ id: uuid.v4() }];
      db.VesselParticipantCrew.findAll.mockResolvedValueOnce(mockCrews);
      db.Participant.destroy.mockResolvedValueOnce(1);

      const result = await deleteParticipant(
        [mockParticipant.id],
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.Participant.findByPk).not.toHaveBeenCalled();
      expect(db.VesselParticipantCrew.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participantId: {
              [db.Op.in]: [mockParticipant.id],
            },
          },
          attributes: expect.arrayContaining(['id']),
        }),
      );
      expect(db.Participant.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledTimes(1);
      expect(db.VesselParticipantCrewTrackJson.destroy).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('getEvent', () => {
    it('should return participant detail with the calendar event data', async () => {
      db.Participant.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return {
            ...mockParticipant,
            calendarEvent: {
              id: mockParticipant.calendarEventId,
              name: `Event #${faker.random.numeric(1)}`,
            },
          };
        },
      });

      const result = await getEvent(mockParticipant.id);

      expect(result).toEqual(
        expect.objectContaining({
          ...mockParticipant,
          calendarEvent: expect.objectContaining({
            name: expect.any(String),
          }),
        }),
      );
      expect(db.Participant.findByPk).toHaveBeenCalledWith(mockParticipant.id, {
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'event' }),
        ]),
      });
    });
  });

  describe('getRacesQuery', () => {
    it('should return sequelize parameters based on participant data', async () => {
      db.Participant.findByPk.mockResolvedValueOnce(mockParticipant);
      const result = await getRacesQuery(mockParticipant.id);

      expect(result).toEqual(
        expect.objectContaining({
          where: {
            calendarEventId: mockParticipant.calendarEventId,
          },
          attributes: expect.anything(),
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'group',
              required: true,
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantGroupId',
                'name',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'vesselParticipants',
                  required: true,
                  attributes: expect.arrayContaining([
                    'id',
                    'vesselParticipantId',
                    'vesselId',
                  ]),
                  include: expect.arrayContaining([
                    expect.objectContaining({
                      as: 'vessel',
                      attributes: expect.arrayContaining([
                        'id',
                        'globalId',
                        'publicName',
                      ]),
                      paranoid: false,
                    }),
                    expect.objectContaining({
                      as: 'participants',
                      required: true,
                      attributes: expect.arrayContaining([
                        'id',
                        'publicName',
                        'trackerUrl',
                        'userProfileId',
                        'invitationStatus',
                      ]),
                      where: {
                        id: mockParticipant.id,
                        invitationStatus: {
                          [db.Op.in]: [
                            participantInvitationStatus.ACCEPTED,
                            participantInvitationStatus.SELF_REGISTERED,
                          ],
                        },
                      },
                    }),
                  ]),
                }),
              ]),
            }),
          ]),
        }),
      );
      expect(db.Participant.findByPk).toHaveBeenCalledTimes(1);
    });
    it('should throw an error when participant not found', async () => {
      db.Participant.findByPk.mockResolvedValueOnce(undefined);
      await expect(getRacesQuery(mockParticipant.id)).rejects.toThrow(
        new ValidationError('participant not found'),
      );
    });
  });

  describe('getRaces', () => {
    beforeAll(() => {
      db.Participant.findByPk.mockResolvedValue(mockParticipant);
    });
    afterAll(() => {
      db.Participant.findByPk.mockReset();
    });
    it('should findAllWithpaging to CompetitionUnit with participant data', async () => {
      const query = await getRacesQuery(mockParticipant.id);
      db.CompetitionUnit.findAllWithPaging.mockResolvedValueOnce([]);
      const paging = { page: 1, size: 10 };
      const result = await getRaces(mockParticipant.id, paging);

      expect(db.CompetitionUnit.findAllWithPaging).toHaveBeenCalledWith(
        query,
        paging,
      );
      expect(result).toEqual([]);
    });
  });

  describe('getRacesWithoutPaging', () => {
    beforeAll(() => {
      db.Participant.findByPk.mockResolvedValue(mockParticipant);
    });
    afterAll(() => {
      db.Participant.findByPk.mockReset();
    });
    it('should findAll to CompetitionUnit with participant data', async () => {
      const query = await getRacesQuery(mockParticipant.id);
      db.CompetitionUnit.findAll.mockResolvedValueOnce([
        {
          toJSON: () => {
            return { id: uuid.v4() };
          },
        },
      ]);
      await getRacesWithoutPaging(mockParticipant.id);

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getByUserAndEvent', () => {
    it('should findOne Participant based on user and calendar', async () => {
      db.Participant.findOne.mockResolvedValueOnce({
        toJSON: () => mockParticipant,
      });
      const userId = uuid.v4();
      const calendarEventId = uuid.v4();
      const result = await getByUserAndEvent(
        userId,
        calendarEventId,
        mockTransaction,
      );

      expect(result).toEqual(mockParticipant);
      expect(db.Participant.findOne).toHaveBeenCalledWith({
        where: {
          userProfileId: userId,
          calendarEventId,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'event',
          }),
          expect.objectContaining({
            as: 'profile',
            attributes: expect.arrayContaining(['id']),
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'participationCharge',
                required: false,
                attributes: expect.arrayContaining([
                  'paymentDate',
                  'checkoutSessionId',
                ]),
                where: {
                  calendarEventId,
                },
              }),
            ]),
          }),
        ]),
        transaction: mockTransaction,
      });
    });
  });

  describe('findDuplicate', () => {
    it('should return findOne on Participant', async () => {
      const params = {
        id: uuid.v4(),
        userProfileId: uuid.v4(),
        calendarEventId: uuid.v4(),
      };
      db.Participant.findOne.mockResolvedValueOnce({
        toJSON: () => mockParticipant,
      });

      const result = await findDuplicate(params, mockTransaction);

      expect(result).toEqual(mockParticipant);
      expect(db.Participant.findOne).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.ne]: params.id,
          },
          userProfileId: params.userProfileId,
          calendarEventId: params.calendarEventId,
        },
        transaction: mockTransaction,
      });
    });

    it('should return null immediately when not provided with any 1 of id/user Id/event Id', async () => {
      const result = await findDuplicate(undefined, mockTransaction);

      expect(result).toEqual(null);
      expect(db.Participant.findOne).not.toHaveBeenCalled();
    });
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on Participant', async () => {
      const mockParticipants = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            publicName: faker.name.findName(),
            trackerUrl: faker.internet.url(),
            calendarEventId: uuid.v4(),
            userProfileId: uuid.v4(),
            invitationStatus: participantInvitationStatus.ACCEPTED,
            allowShareInformation: false,
          };
        });
      db.Participant.bulkCreate.mockResolvedValueOnce(mockParticipants);

      const result = await bulkCreate(mockParticipants, mockTransaction);

      expect(result).toEqual(mockParticipants);
      expect(db.Participant.bulkCreate).toHaveBeenCalledWith(mockParticipants, {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      });
    });

    it('should not insert to DB when provided with empty array', async () => {
      const result = await bulkCreate([]);

      expect(result).toEqual([]);
      expect(db.Participant.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('bulkCreateWithOptions', () => {
    it('should call bulkCreate on Vessel with customizable options', async () => {
      const mockParticipants = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            publicName: faker.name.findName(),
            trackerUrl: faker.internet.url(),
            calendarEventId: uuid.v4(),
            userProfileId: uuid.v4(),
            invitationStatus: participantInvitationStatus.ACCEPTED,
            allowShareInformation: false,
          };
        });
      db.Participant.bulkCreate.mockResolvedValueOnce(mockParticipants);

      const result = await bulkCreateWithOptions(mockParticipants, {
        transaction: mockTransaction,
      });

      expect(result).toEqual(mockParticipants);
      expect(db.Participant.bulkCreate).toHaveBeenCalledWith(mockParticipants, {
        transaction: mockTransaction,
      });
    });

    it('should not insert to DB when provided with empty array', async () => {
      const result = await bulkCreateWithOptions([], mockTransaction);

      expect(result).toEqual([]);
      expect(db.Participant.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('updateUserlessParticipants', () => {
    it('should populate userless participant with the provided user', async () => {
      const userProfileId = uuid.v4();
      const email = faker.internet.email();
      db.Participant.update.mockResolvedValueOnce([1, undefined]);

      const result = await updateUserlessParticipants(
        userProfileId,
        email,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.Participant.update).toHaveBeenCalledWith(
        { userProfileId },
        {
          where: {
            participantId: email,
            userProfileId: { [db.Op.eq]: null },
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('update', () => {
    it('should update participant data using the id', async () => {
      db.Participant.update.mockResolvedValueOnce([1, undefined]);

      const result = await update(
        mockParticipant.id,
        mockParticipant,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.Participant.update).toHaveBeenCalledWith(mockParticipant, {
        where: {
          id: mockParticipant.id,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getInvitation', () => {
    it('should findAllWithPaging on Participant', async () => {
      db.Participant.findAllWithPaging.mockResolvedValueOnce([]);
      const paging = { page: 1, size: 10 };
      const userId = uuid.v4();

      const result = await getInvitation(paging, userId);

      expect(result).toEqual([]);
      expect(db.Participant.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            userProfileId: userId,
            invitationStatus: participantInvitationStatus.INVITED,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'event',
              required: true,
              where: {
                status: {
                  [db.Op.notIn]: [
                    calendarEventStatus.DRAFT,
                    calendarEventStatus.COMPLETED,
                  ],
                },
              },
              attributes: expect.arrayContaining([
                'id',
                'name',
                'isOpen',
                'allowRegistration',
                'approximateStartTime',
                'approximateStartTime_utc',
                'approximateStartTime_zone',
                'requiredCertifications',
                'requireCovidCertificate',
                'requireEmergencyContact',
                'requireImmigrationInfo',
                'requireMedicalProblems',
                'requireFoodAllergies',
              ]),
            }),
          ]),
        },
        paging,
      );
    });
  });

  describe('removeFromAllVesselParticipant', () => {
    const participantId = uuid.v4();
    const mockCrews = Array(2)
      .fill()
      .map(() => {
        const vesselParticipantId = uuid.v4();
        return {
          id: uuid.v4(),
          startedStream: false,
          participantId,
          vesselParticipantId,
          vesselParticipant: {
            id: vesselParticipantId,
            participants: [{ id: participantId }],
          },
        };
      });
    beforeAll(() => {
      db.VesselParticipantCrew.findAll.mockResolvedValue(
        mockCrews.map((row) => {
          return {
            toJSON: () => row,
          };
        }),
      );
      db.VesselParticipantCrew.destroy.mockResolvedValue(1);
    });
    afterAll(() => {
      db.VesselParticipantCrew.findAll.mockReset();
      db.VesselParticipantCrew.destroy.mockReset();
    });
    it('should remove VP crew connected with the participant, and remove orphan VP by default', async () => {
      const result = await removeFromAllVesselParticipant(
        participantId,
        undefined,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledWith({
        where: {
          participantId,
        },
        transaction: mockTransaction,
      });
      expect(db.VesselParticipant.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: mockCrews.map((row) => row.vesselParticipantId),
          },
        },
        transaction: mockTransaction,
      });
    });
    it('should remove VP crew connected with the participant, and not remove the VP if flag is false', async () => {
      const result = await removeFromAllVesselParticipant(participantId, {
        deleteOrphanedVp: false,
      });

      expect(result).toEqual(1);
      expect(db.VesselParticipantCrew.destroy).toHaveBeenCalledWith({
        where: {
          participantId,
        },
        undefined,
      });
      expect(db.VesselParticipant.destroy).not.toHaveBeenCalled();
    });
  });

  describe('getAllWithoutPaging', () => {
    it('should findAll Participant with all provided params', async () => {
      const where = {
        id: uuid.v4(),
      };
      const attributes = ['id'];
      await getAllWithoutPaging(where, attributes);

      expect(db.Participant.findAll).toHaveBeenCalledWith({
        where,
        attributes,
        raw: true,
      });
    });
    it('should findAll Participant without any params if not provided', async () => {
      await getAllWithoutPaging();

      expect(db.Participant.findAll).toHaveBeenCalledWith({ raw: true });
    });
  });

  describe('getByUserAndRace', () => {
    it('should findOne competition with a participant detail', async () => {
      const competitionUnitId = uuid.v4();
      const userId = uuid.v4();
      db.CompetitionUnit.findOne.mockResolvedValueOnce({
        toJSON: () => {
          return { id: competitionUnitId };
        },
      });
      await getByUserAndRace(competitionUnitId, userId);

      expect(db.CompetitionUnit.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: competitionUnitId,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'group',
              required: true,
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantGroupId',
                'name',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'vesselParticipants',
                  required: true,
                  attributes: expect.arrayContaining([
                    'id',
                    'vesselParticipantId',
                    'vesselId',
                  ]),
                  include: expect.arrayContaining([
                    expect.objectContaining({
                      as: 'vessel',
                      attributes: expect.arrayContaining([
                        'id',
                        'globalId',
                        'publicName',
                      ]),
                      paranoid: false,
                    }),
                    expect.objectContaining({
                      as: 'participants',
                      required: true,
                      attributes: expect.arrayContaining([
                        'id',
                        'publicName',
                        'trackerUrl',
                        'userProfileId',
                        'invitationStatus',
                      ]),
                      where: {
                        userProfileId: userId,
                        invitationStatus: {
                          [db.Op.in]: [
                            participantInvitationStatus.ACCEPTED,
                            participantInvitationStatus.SELF_REGISTERED,
                          ],
                        },
                      },
                    }),
                  ]),
                }),
              ]),
            }),
          ]),
        }),
        undefined,
      );
    });
  });

  describe('getAllWithShareableInfo', () => {
    const calendarEventId = uuid.v4();
    const participantId = uuid.v4();
    const expectedInclude = expect.arrayContaining([
      expect.objectContaining({
        as: 'profile',
        attributes: expect.arrayContaining([
          'id',
          'name',
          'email',
          'birthdate',
          'address',
          'phone_number',
          'phone_number_verified',
        ]),
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'participationCharge',
            required: false,
            attributes: expect.arrayContaining([
              'paymentDate',
              'checkoutSessionId',
            ]),
            where: {
              calendarEventId,
            },
          }),
          expect.objectContaining({
            as: 'shareables',
            required: false,
          }),
        ]),
      }),
      expect.objectContaining({
        as: 'waiverAgreements',
        required: false,
        attributes: expect.arrayContaining(['waiverType', 'agreedAt']),
      }),
      expect.objectContaining({
        as: 'documentAgreements',
        through: {
          attributes: ['createdAt'],
        },
        attributes: expect.arrayContaining(['id', 'documentName']),
        required: false,
      }),
    ]);
    it('should findAll Participant to an event with their sharable info', async () => {
      db.Participant.findAll.mockResolvedValueOnce([]);
      await getAllWithShareableInfo(calendarEventId);

      expect(db.Participant.findAll).toHaveBeenCalledWith({
        where: {
          calendarEventId,
          invitationStatus: {
            [db.Op.in]: [
              participantInvitationStatus.ACCEPTED,
              participantInvitationStatus.SELF_REGISTERED,
            ],
          },
        },
        attributes: expect.arrayContaining([
          'id',
          'publicName',
          'allowShareInformation',
        ]),
        include: expectedInclude,
      });
    });
    it('should findAll Participant to an event with the sharable info for the provided participant id', async () => {
      db.Participant.findAll.mockResolvedValueOnce([]);
      await getAllWithShareableInfo(calendarEventId, participantId);

      expect(db.Participant.findAll).toHaveBeenCalledWith({
        where: {
          calendarEventId,
          invitationStatus: {
            [db.Op.in]: [
              participantInvitationStatus.ACCEPTED,
              participantInvitationStatus.SELF_REGISTERED,
            ],
          },
          id: participantId,
        },
        attributes: expect.arrayContaining([
          'id',
          'publicName',
          'allowShareInformation',
        ]),
        include: expectedInclude,
      });
    });
  });

  describe('getByIdWithVaccineAndPassport', () => {
    it('should findByPk Participant with provided participantId', async () => {
      const participantId = uuid.v4();
      await getByIdWithVaccineAndPassport(participantId);

      expect(db.Participant.findByPk).toHaveBeenCalledWith(participantId, {
        attributes: expect.arrayContaining(['id', 'allowShareInformation']),
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'profile',
            attributes: ['id', 'name'],
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'shareables',
                required: false,
                attributes: expect.arrayContaining([
                  'covidVaccinationCard',
                  'passportPhoto',
                ]),
              }),
            ]),
          }),
        ]),
      });
    });
  });
});
