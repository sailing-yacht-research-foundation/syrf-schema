const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  upsert,
  getAll,
  getById,
  delete: deleteCompetition,
  setStart,
  setEnd,
  updateCourse,
  getOnGoingRacesWithCourse,
  updateCountryCity,
  addOpenGraphImage,
  getTracksCountByCompetition,
  update,
  getScheduledRaces,
  getUserRelationToCompetitionUnit,
  getUntrackedRaces,
  getRelatedFiles,
  getWithVesselParticipant,
  getAllActiveSimulations,
  setCanceled,
  getWinds,
  bulkWriteWinds,
  getAllByIds,
} = require('../../dataAccess/v1/competitionUnit');

const {
  competitionUnitStatus,
  calendarEventStatus,
  conversionValues,
  participantInvitationStatus,
  groupMemberStatus,
  dataSources,
} = require('../../enums');
const {
  emptyPagingResponse,
  removeDomainFromUrl,
} = require('../../utils/utils');

const db = require('../../index');

describe('Competition Unit DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  const mockCompetition = {
    id: uuid.v4(),
    name: `Competition #${faker.random.numeric(2)}`,
    isCompleted: false,
    calendarEventId: uuid.v4(),
    courseId: uuid.v4(),
    country: faker.address.country(),
    city: faker.address.city(),
    status: competitionUnitStatus.ONGOING,
    openGraphImage: `${faker.internet.url()}/file/image.jpg`,
  };
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'calendarEvent',
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'editors',
        }),
        expect.objectContaining({
          as: 'owner',
        }),
      ]),
    }),
    expect.objectContaining({
      as: 'vesselParticipantGroup',
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
      db.CompetitionUnit.upsert.mockImplementation(
        async (detail, _transaction) => {
          return [
            {
              toJSON: () => {
                return { ...mockCompetition, ...detail };
              },
            },
            true,
          ];
        },
      );
    });
    afterAll(() => {
      db.CompetitionUnit.upsert.mockReset();
    });
    it('should call upsert on CompetitionUnit table and generate random uuid when not provided', async () => {
      const result = await upsert(
        null,
        { ...mockCompetition, id: undefined },
        mockTransaction,
      );

      expect(result).toEqual({
        ...mockCompetition,
        id: expect.any(String),
      });
      expect(db.CompetitionUnit.upsert).toHaveBeenCalledWith(
        {
          ...mockCompetition,
          id: expect.any(String),
        },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on Competition Unit table and use the provided uuid', async () => {
      const result = await upsert(mockCompetition.id, mockCompetition);

      expect(result).toEqual(mockCompetition);
      expect(db.CompetitionUnit.upsert).toHaveBeenCalledWith(mockCompetition, {
        transaction: undefined,
      });
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const result = await upsert(mockCompetition.id);

      expect(result).toEqual(mockCompetition);
      expect(db.CompetitionUnit.upsert).toHaveBeenCalledWith(
        { id: mockCompetition.id },
        { transaction: undefined },
      );
    });
  });

  describe('getAll', () => {
    it('should find all competition in a calendar event', async () => {
      const paging = { page: 1, size: 10 };
      const params = { calendarEventId: mockCompetition.calendarEventId };

      await getAll(paging, params);

      expect(db.CompetitionUnit.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            calendarEventId: params.calendarEventId,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'calendarEvent',
              required: false,
              where: {},
            }),
            expect.objectContaining({
              as: 'course',
            }),
          ]),
        }),
        { ...paging, defaultSort: [] },
      );
    });
    it('should add conditions on where when provided in params', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const params = {
        calendarEventId: mockCompetition.calendarEventId,
        status: competitionUnitStatus.ONGOING,
        eventStatus: calendarEventStatus.ONGOING,
        isOpen: true,
        isPrivate: false,
      };

      await getAll(paging, params);

      expect(db.CompetitionUnit.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            calendarEventId: params.calendarEventId,
            status: params.status,
            name: {
              [db.Op.like]: `%${paging.query}%`,
            },
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'calendarEvent',
              required: true,
              where: {
                status: params.eventStatus,
                isOpen: params.isOpen,
                isPrivate: params.isPrivate,
              },
            }),
            expect.objectContaining({
              as: 'course',
            }),
          ]),
        }),
        { ...paging, defaultSort: [] },
      );
    });
    it('should query using userId if not provided with eventId or position', async () => {
      const paging = { page: 1, size: 10 };
      const params = {
        userId: uuid.v4(),
      };

      await getAll(paging, params);

      expect(db.CompetitionUnit.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdById: params.userId,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'calendarEvent',
              required: false,
              where: {},
            }),
            expect.objectContaining({
              as: 'course',
            }),
          ]),
        }),
        { ...paging, defaultSort: [] },
      );
    });
    it('should query by position when provided with a position param', async () => {
      const paging = { page: 1, size: 10 };
      const params = {
        position: [
          Number(faker.address.longitude()),
          Number(faker.address.latitude()),
        ],
        radius: 1,
      };

      await getAll(paging, params);

      expect(db.CompetitionUnit.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: expect.objectContaining({
            include: [
              [
                db.Sequelize.fn(
                  'ST_DistanceSphere',
                  db.Sequelize.literal('"approximateStartLocation"'),
                  db.Sequelize.literal(`ST_MakePoint(:lon, :lat)`),
                ),
                'distance',
              ],
            ],
          }),
          where: {
            [db.Op.and]: [
              db.Sequelize.where(
                db.Sequelize.fn(
                  'ST_DistanceSphere',
                  db.Sequelize.literal('"approximateStartLocation"'),
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
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'calendarEvent',
              required: true,
              where: {
                isSimulation: false,
              },
            }),
            expect.objectContaining({
              as: 'course',
            }),
          ]),
        },
        {
          ...paging,
          defaultSort: [
            [
              db.Sequelize.literal(
                `"approximateStartLocation" <-> 'SRID=4326;POINT(:lon :lat)'::geometry`,
              ),
            ],
          ],
        },
      );
    });
    it('should include simulation when includeSimulation param is true', async () => {
      const paging = { page: 1, size: 10 };
      const params = {
        position: [
          Number(faker.address.longitude()),
          Number(faker.address.latitude()),
        ],
        radius: 1,
        includeSimulation: true,
      };

      await getAll(paging, params);

      expect(db.CompetitionUnit.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'calendarEvent',
              required: false,
              where: {},
            }),
            expect.objectContaining({
              as: 'course',
            }),
          ]),
        }),
        expect.anything(),
      );
    });
    it('should not fetch to DB and return empty response if provided with filter without calendar event, position or user id', async () => {
      const paging = { page: 1, size: 10 };
      const result = await getAll(paging, {});

      expect(result).toEqual(emptyPagingResponse(paging));
      expect(db.CompetitionUnit.findAllWithPaging).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should findByPk and has default include', async () => {
      const detailedCompetition = {
        ...mockCompetition,
        calendarEvent: {
          id: mockCompetition.calendarEventId,
          name: `Event ${faker.random.word()}`,
          editors: [],
          owner: {
            id: uuid.v4(),
            name: faker.name.findName(),
          },
        },
        vesselParticipantGroup: {
          id: uuid.v4(),
        },
      };
      db.CompetitionUnit.findByPk.mockResolvedValueOnce({
        toJSON: () => detailedCompetition,
      });
      const result = await getById(mockCompetition.id);

      expect(result).toEqual(detailedCompetition);
      expect(db.CompetitionUnit.findByPk).toHaveBeenCalledWith(
        mockCompetition.id,
        {
          include: defaultIncludeExpectation,
          transaction: undefined,
        },
      );
    });
    it('should not include anything if includeDetail param is set to false', async () => {
      db.CompetitionUnit.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return mockCompetition;
        },
      });
      const result = await getById(mockCompetition.id, false);

      expect(result).toEqual(mockCompetition);
      expect(db.CompetitionUnit.findByPk).toHaveBeenCalledWith(
        mockCompetition.id,
        {
          transaction: undefined,
        },
      );
    });
  });

  describe('delete', () => {
    it('should destroy all related data to the competition', async () => {
      const detailedCompetition = {
        ...mockCompetition,
        calendarEvent: {
          id: mockCompetition.calendarEventId,
          name: `Event ${faker.random.word()}`,
          editors: [],
          owner: {
            id: uuid.v4(),
            name: faker.name.findName(),
          },
        },
        vesselParticipantGroup: {
          id: uuid.v4(),
        },
      };
      db.CompetitionUnit.findByPk.mockResolvedValueOnce({
        toJSON: () => detailedCompetition,
      });

      const result = await deleteCompetition(
        mockCompetition.id,
        mockTransaction,
      );

      expect(result).toEqual(detailedCompetition);
      expect(db.CompetitionUnit.findByPk).toHaveBeenCalledTimes(1);
      expect(db.CompetitionUnit.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: [mockCompetition.id],
          },
        },
        transaction: mockTransaction,
      });
      [
        db.VesselParticipantCrewTrackJson.destroy,
        db.TrackHistory.destroy,
        db.CompetitionResult.destroy,
        db.CompetitionLeg.destroy,
        db.CompetitionPointTrackJson.destroy,
        db.CompetitionUnitWind.destroy,
        db.SlicedWeather.destroy,
        db.VesselParticipantLeg.destroy,
        db.VesselParticipantTrackJson.destroy,
        db.SlicedWeather.destroy,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            competitionUnitId: {
              [db.Op.in]: [mockCompetition.id],
            },
          },
          transaction: mockTransaction,
        });
      });
    });

    it('should work with array of id', async () => {
      const ids = [mockCompetition.id];
      db.CompetitionUnit.destroy.mockResolvedValueOnce(ids.length);

      const result = await deleteCompetition(ids, mockTransaction);

      expect(result).toEqual(ids.length);
      expect(db.CompetitionUnit.findByPk).not.toHaveBeenCalled();
      expect(db.CompetitionUnit.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: ids,
          },
        },
        transaction: mockTransaction,
      });
      [
        db.VesselParticipantCrewTrackJson.destroy,
        db.TrackHistory.destroy,
        db.CompetitionResult.destroy,
        db.CompetitionLeg.destroy,
        db.CompetitionPointTrackJson.destroy,
        db.CompetitionUnitWind.destroy,
        db.SlicedWeather.destroy,
        db.VesselParticipantLeg.destroy,
        db.VesselParticipantTrackJson.destroy,
        db.SlicedWeather.destroy,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            competitionUnitId: {
              [db.Op.in]: ids,
            },
          },
          transaction: mockTransaction,
        });
      });
    });
  });

  describe('setStart', () => {
    it('should update competition unit status to ONGOING', async () => {
      db.CompetitionUnit.update.mockResolvedValueOnce([1, undefined]);

      const result = await setStart(mockCompetition.id, mockTransaction);

      expect(result).toEqual(1);
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        {
          status: competitionUnitStatus.ONGOING,
        },
        {
          where: {
            id: mockCompetition.id,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('setEnd', () => {
    it('should update competition unit status to COMPLETED', async () => {
      db.CompetitionUnit.update.mockResolvedValueOnce([1, undefined]);

      const result = await setEnd(mockCompetition.id, mockTransaction);

      expect(result).toEqual(1);
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        {
          endTime: expect.any(Date),
          isCompleted: true,
          status: competitionUnitStatus.COMPLETED,
        },
        {
          where: {
            id: mockCompetition.id,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('updateCourse', () => {
    it('should update competition unit course', async () => {
      const courseId = uuid.v4();
      db.CompetitionUnit.update.mockResolvedValueOnce([1, undefined]);

      const result = await updateCourse(mockCompetition.id, courseId);

      expect(result).toEqual(1);
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        {
          courseId,
        },
        {
          where: {
            id: mockCompetition.id,
          },
        },
      );
    });
  });

  describe('getOnGoingRacesWithCourse', () => {
    it('should findAll ONGOING competition unit with non-null course', async () => {
      await getOnGoingRacesWithCourse();

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          raw: true,
          where: {
            status: competitionUnitStatus.ONGOING,
            courseId: {
              [db.Op.ne]: null,
            },
          },
        }),
      );
    });
  });

  describe('updateCountryCity', () => {
    it('should update competition unit country & city', async () => {
      const competitionUnitIds = [mockCompetition.id];
      const data = {
        country: faker.address.country(),
        city: faker.address.city(),
        centerPoint: [
          Number(faker.address.longitude()),
          Number(faker.address.latitude()),
        ],
        timezone: 'Asia/Jakarta',
      };
      await updateCountryCity(competitionUnitIds, data, mockTransaction);

      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        {
          country: data.country,
          city: data.city,
          approximateStartLocation: {
            crs: {
              type: 'name',
              properties: { name: 'EPSG:4326' },
            },
            type: 'Point',
            coordinates: data.centerPoint,
          },
          approximateStart_zone: data.timezone,
        },
        {
          where: {
            id: {
              [db.Op.in]: competitionUnitIds,
            },
          },
          transaction: mockTransaction,
        },
      );
    });

    it('should update competition unit country & city to null if not provided with data', async () => {
      const competitionUnitIds = [mockCompetition.id];
      await updateCountryCity(competitionUnitIds, undefined, mockTransaction);

      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        {
          country: undefined,
          city: undefined,
          approximateStartLocation: null,
          approximateStart_zone: undefined,
        },
        {
          where: {
            id: {
              [db.Op.in]: competitionUnitIds,
            },
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('addOpenGraphImage', () => {
    it('should update CompetitionUnit openGraphImage', async () => {
      const ids = [mockCompetition.id];
      const data = { openGraphImage: faker.internet.url() };
      await addOpenGraphImage(ids, data, mockTransaction);

      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        {
          openGraphImage: data.openGraphImage,
        },
        {
          where: {
            id: {
              [db.Op.in]: ids,
            },
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('getTracksCountByCompetition', () => {
    it('should findAll and return total count of track', async () => {
      const mockCompetitions = Array(3)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            trackCount: faker.datatype.number({ min: 0, max: 10 }),
          };
        });
      let totalExpectedCount = 0;
      db.CompetitionUnit.findAll.mockResolvedValueOnce(
        mockCompetitions.map((row) => {
          totalExpectedCount += row.trackCount;
          return { getDataValue: () => row.trackCount };
        }),
      );

      const result = await getTracksCountByCompetition(
        mockCompetitions.map((row) => row.id),
      );

      expect(result).toEqual(totalExpectedCount);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining([
          'id',
          [
            db.Sequelize.fn('count', db.Sequelize.col('"vpTrackJsons"."id"')),
            'trackCount',
          ],
        ]),
        where: {
          id: {
            [db.Op.in]: mockCompetitions.map((row) => row.id),
          },
        },
        include: [
          expect.objectContaining({
            as: 'vpTrackJsons',
            required: false,
          }),
        ],
        subQuery: false,
        group: ['"CompetitionUnit"."id"'],
      });
    });
  });

  describe('update', () => {
    beforeAll(() => {
      db.CompetitionUnit.update.mockResolvedValue([1, [mockCompetition]]);
    });
    afterAll(() => {
      db.CompetitionUnit.update.mockReset();
    });
    it('should work with single id', async () => {
      const data = {
        name: mockCompetition.name,
      };
      const result = await update(mockCompetition.id, data, mockTransaction);

      expect(result).toEqual({
        updateCount: 1,
        updatedData: [mockCompetition],
      });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(data, {
        where: {
          id: {
            [db.Op.in]: [mockCompetition.id],
          },
        },
        returning: true,
        transaction: mockTransaction,
      });
    });

    it('should work with multiple ids', async () => {
      const data = {
        name: mockCompetition.name,
      };
      const result = await update([mockCompetition.id], data, mockTransaction);

      expect(result).toEqual({
        updateCount: 1,
        updatedData: [mockCompetition],
      });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(data, {
        where: {
          id: {
            [db.Op.in]: [mockCompetition.id],
          },
        },
        returning: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('getScheduledRaces', () => {
    it('should return all SCHEDULED competitions', async () => {
      const mockCompetitions = [
        {
          ...mockCompetition,
          status: competitionUnitStatus.SCHEDULED,
          calendarEvent: {
            id: mockCompetition.calendarEventId,
            name: `Event ${faker.random.word()}`,
            status: calendarEventStatus.ONGOING,
          },
        },
      ];
      db.CompetitionUnit.findAll.mockResolvedValueOnce(
        mockCompetitions.map((row) => {
          return {
            toJSON: () => {
              return row;
            },
          };
        }),
      );

      const result = await getScheduledRaces();

      expect(result).toEqual(mockCompetitions);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          status: competitionUnitStatus.SCHEDULED,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'calendarEvent',
            required: true,
            where: {
              status: {
                [db.Op.in]: [
                  calendarEventStatus.SCHEDULED,
                  calendarEventStatus.ONGOING,
                ],
              },
            },
          }),
        ]),
        transaction: undefined,
      });
    });
  });

  describe('getUserRelationToCompetitionUnit', () => {
    it('should findAll Competitionunit', async () => {
      const ids = Array(5)
        .fill()
        .map(() => uuid.v4());
      const userId = uuid.v4();
      const options = {
        attributes: ['id'],
      };
      const mockCompetitions = ids.map((row) => {
        return { id: row, group: faker.datatype.json() };
      });
      db.CompetitionUnit.findAll.mockResolvedValueOnce(
        mockCompetitions.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getUserRelationToCompetitionUnit(
        ids,
        userId,
        options,
        mockTransaction,
      );

      expect(result).toEqual(mockCompetitions);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        ...options,
        where: {
          id: {
            [db.Op.in]: ids,
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'group',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'vesselParticipants',
                include: expect.arrayContaining([
                  expect.objectContaining({
                    as: 'vessel',
                    paranoid: false,
                  }),
                  expect.objectContaining({
                    as: 'participants',
                    required: true,
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
          expect.objectContaining({
            as: 'calendarEvent',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'editors',
                required: false,
                where: {
                  id: userId,
                },
              }),
              expect.objectContaining({
                as: 'groupEditors',
                include: expect.arrayContaining([
                  expect.objectContaining({
                    as: 'groupMember',
                    where: {
                      status: groupMemberStatus.accepted,
                      userId,
                    },
                  }),
                ]),
              }),
            ]),
          }),
        ]),
        transaction: mockTransaction,
      });
    });
    it('should return empty array and skip db query if not provided with required ids', async () => {
      const result = await getUserRelationToCompetitionUnit(
        undefined,
        uuid.v4(),
      );

      expect(result).toEqual([]);
      expect(db.CompetitionUnit.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getUntrackedRaces', () => {
    it('should findAll competitions that start before specified time, and has no tracks', async () => {
      const filterDate = new Date();
      const mockCompetitions = Array(5)
        .fill()
        .map(() => {
          const id = uuid.v4();
          const calendarEventId = uuid.v4();
          return {
            id,
            calendarEventId,
            tracks: null,
            calendarEvent: {
              id: calendarEventId,
              competitionUnit: [id],
            },
          };
        });
      db.CompetitionUnit.findAll.mockResolvedValueOnce(
        mockCompetitions.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getUntrackedRaces(filterDate);

      expect(result).toEqual(mockCompetitions);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRelatedFiles', () => {
    beforeAll(() => {
      db.VesselParticipantTrackJson.findAll.mockResolvedValue([
        {
          providedStorageKey: 'path/to/file',
          simplifiedStorageKey: 'path/to/file',
          calculatedStorageKey: 'path/to/file',
        },
      ]);
      db.VesselParticipantCrewTrackJson.findAll.mockResolvedValue([
        {
          storageKey: 'path/to/file',
        },
      ]);
      db.CompetitionPointTrackJson.findAll.mockResolvedValue([
        { storageKey: 'path/to/file' },
      ]);
      db.SlicedWeather.findAll.mockResolvedValue([
        {
          s3Key: 'path/to/file',
        },
      ]);
    });
    afterAll(() => {
      db.VesselParticipantTrackJson.findAll.mockReset();
      db.VesselParticipantCrewTrackJson.findAll.mockReset();
      db.CompetitionPointTrackJson.findAll.mockReset();
      db.SlicedWeather.findAll.mockReset();
    });
    it('should query for all files related to the competition', async () => {
      db.CompetitionUnit.findByPk.mockResolvedValueOnce(mockCompetition);

      const result = await getRelatedFiles(mockCompetition.id);

      expect(result).toEqual([
        {
          type: 'og_image',
          path: removeDomainFromUrl(mockCompetition.openGraphImage),
          bucket: 'opengraph_image',
        },
        {
          type: 'vp_track_json',
          path: 'path/to/file',
          bucket: 'individual_track',
        },
        {
          type: 'vp_simplified_track_json',
          path: 'path/to/file',
          bucket: 'individual_track',
        },
        {
          type: 'vp_calculated_track_json',
          path: 'path/to/file',
          bucket: 'individual_track',
        },
        {
          type: 'vp_point_track_json',
          path: 'path/to/file',
          bucket: 'individual_track',
        },
        {
          type: 'vp_crew_track_json',
          path: 'path/to/file',
          bucket: 'individual_track',
        },
        {
          type: 'sliced_weather',
          path: 'path/to/file',
          bucket: 'sliced_weather',
        },
      ]);
      expect(db.CompetitionUnit.findByPk).toHaveBeenCalledWith(
        mockCompetition.id,
        { transaction: undefined },
      );
      [
        db.VesselParticipantTrackJson.findAll,
        db.VesselParticipantCrewTrackJson.findAll,
        db.CompetitionPointTrackJson.findAll,
        db.SlicedWeather.findAll,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            competitionUnitId: mockCompetition.id,
          },
          transaction: undefined,
        });
      });
    });
    it('should exclude og image if not available', async () => {
      db.CompetitionUnit.findByPk.mockResolvedValueOnce({
        ...mockCompetition,
        openGraphImage: null,
      });

      const result = await getRelatedFiles(mockCompetition.id);

      expect(result).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'og_image',
            bucket: 'opengraph_image',
          }),
        ]),
      );
    });
    it('should return empty array if competition is not found', async () => {
      db.CompetitionUnit.findByPk.mockResolvedValueOnce(undefined);

      const result = await getRelatedFiles(uuid.v4());

      expect(result).toEqual([]);
      [
        db.VesselParticipantTrackJson.findAll,
        db.VesselParticipantCrewTrackJson.findAll,
        db.CompetitionPointTrackJson.findAll,
        db.SlicedWeather.findAll,
      ].forEach((dbFunc) => {
        expect(dbFunc).not.toHaveBeenCalled();
      });
    });
  });

  describe('getWithVesselParticipant', () => {
    it('should query for a competition with a certain vessel participant detail', async () => {
      db.CompetitionUnit.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return {
            ...mockCompetition,
            vesselParticipantGroup: faker.datatype.json(),
          };
        },
      });
      const vesselParticipantId = uuid.v4();

      const result = await getWithVesselParticipant(
        mockCompetition.id,
        vesselParticipantId,
      );

      expect(result).toEqual(expect.objectContaining(mockCompetition));
      expect(db.CompetitionUnit.findByPk).toHaveBeenCalledWith(
        mockCompetition.id,
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'vesselParticipantGroup',
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'vesselParticipants',
                  where: {
                    id: vesselParticipantId,
                  },
                  include: expect.arrayContaining([
                    expect.objectContaining({
                      as: 'vessel',
                    }),
                    expect.objectContaining({
                      as: 'crews',
                      include: expect.arrayContaining([
                        expect.objectContaining({
                          as: 'profile',
                          attributes: expect.arrayContaining([
                            'id',
                            'name',
                            'email',
                            'avatar',
                          ]),
                        }),
                      ]),
                    }),
                  ]),
                }),
              ]),
            }),
          ]),
        },
      );
    });
  });

  describe('getAllActiveSimulations', () => {
    const userId = uuid.v4();
    const mockCompetitions = [
      {
        ...mockCompetition,
        calendarEvent: {
          id: mockCompetition.calendarEventId,
          name: `Event ${faker.random.word()}`,
          isPrivate: false,
          isOpen: false,
          status: calendarEventStatus.ONGOING,
          allowRegistration: false,
          organizerGroupId: null,
          stripeProductId: null,
          stripePricingId: null,
          participatingFee: 0,
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
          source: dataSources.SYRF,
          ownerId: userId,
          isSimulation: true,
          scrapedOriginalid: null,
        },
      },
    ];
    beforeAll(() => {
      db.CompetitionUnit.findAll.mockResolvedValue(
        mockCompetitions.map((row) => {
          return {
            toJSON: () => row,
          };
        }),
      );
    });
    afterAll(() => {
      db.CompetitionUnit.findAll.mockReset();
    });
    it('should return all ONGOING simulated competition', async () => {
      const result = await getAllActiveSimulations();

      expect(result).toEqual(mockCompetitions);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          status: competitionUnitStatus.ONGOING,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'calendarEvent',
            required: true,
            where: {
              isSimulation: true,
            },
            attributes: expect.arrayContaining([
              'id',
              'name',
              'isPrivate',
              'isOpen',
              'status',
              'location',
              'source',
              'ownerId',
              'isSimulation',
            ]),
          }),
        ]),
      });
    });

    it('should return all ONGOING simulated competitions of the specified user', async () => {
      const result = await getAllActiveSimulations({ userId });

      expect(result).toEqual(mockCompetitions);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          status: competitionUnitStatus.ONGOING,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'calendarEvent',
            required: true,
            where: {
              isSimulation: true,
              ownerId: userId,
            },
            attributes: expect.arrayContaining([
              'id',
              'name',
              'isPrivate',
              'isOpen',
              'status',
              'location',
              'source',
              'ownerId',
              'isSimulation',
            ]),
          }),
        ]),
      });
    });
  });

  describe('setCanceled', () => {
    it('should update status to CANCELED', async () => {
      db.CompetitionUnit.update.mockResolvedValueOnce([1, undefined]);

      const result = await setCanceled(mockCompetition.id, mockTransaction);

      expect(result).toEqual(1);
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        {
          endTime: expect.any(Date),
          isCompleted: true,
          status: competitionUnitStatus.CANCELED,
        },
        {
          where: {
            id: mockCompetition.id,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('getWinds', () => {
    it('should find all CompetitionUnitWind using competitionUnitId', async () => {
      const mockWinds = [
        {
          id: uuid.v4(),
          competitionUnitId: mockCompetition.id,
          startTime: new Date(),
          endTime: new Date(),
          areaPolygon: {
            crs: {
              type: 'name',
              properties: { name: 'EPSG:4326' },
            },
            type: 'Polygon',
            coordinates: [
              [
                [1, 1],
                [1, 2],
                [2, 2],
                [2, 1],
                [1, 1],
              ],
            ],
          },
          windDirection: faker.datatype.number({
            min: 0,
            max: 360,
            precision: 0.01,
          }),
          windSpeed: faker.datatype.number({ min: 1, max: 20, precision: 0.1 }),
        },
      ];
      db.CompetitionUnitWind.findAll.mockResolvedValueOnce(
        mockWinds.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getWinds(mockCompetition.id);

      expect(result).toEqual(mockWinds);
      expect(db.CompetitionUnitWind.findAll).toHaveBeenCalledWith({
        where: {
          competitionUnitId: mockCompetition.id,
        },
      });
    });
  });

  describe('bulkWriteWinds', () => {
    it('should bulkCreate CompetitionUnitWind and update startTime and endTime on duplicates', async () => {
      const data = [
        {
          competitionUnitId: mockCompetition.id,
          startTime: new Date(),
          endTime: new Date(),
          areaPolygon: {
            crs: {
              type: 'name',
              properties: { name: 'EPSG:4326' },
            },
            type: 'Polygon',
            coordinates: [
              [
                [1, 1],
                [1, 2],
                [2, 2],
                [2, 1],
                [1, 1],
              ],
            ],
          },
          windDirection: faker.datatype.number({
            min: 0,
            max: 360,
            precision: 0.01,
          }),
          windSpeed: faker.datatype.number({ min: 1, max: 20, precision: 0.1 }),
        },
      ];
      db.CompetitionUnitWind.bulkCreate.mockResolvedValueOnce(
        data.map((row) => {
          return {
            toJSON: () => {
              return { id: uuid.v4(), ...row };
            },
          };
        }),
      );

      const result = await bulkWriteWinds(data, mockTransaction);

      expect(result).toEqual(
        data.map((row) => {
          return expect.objectContaining({ ...row, id: expect.any(String) });
        }),
      );
      expect(db.CompetitionUnitWind.bulkCreate).toHaveBeenCalledWith(data, {
        transaction: mockTransaction,
        updateOnDuplicate: ['startTime', 'endTime'],
      });
    });

    it('should skip query to DB and return empty array if provided with undefined/empty array', async () => {
      const result = await bulkWriteWinds();
      expect(result).toEqual([]);
      expect(db.CompetitionUnitWind.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('getAllByIds', () => {
    it('should find bulk competitions', async () => {
      const ids = Array(3)
        .fill()
        .map(() => uuid.v4());
      const attributes = ['id', 'name'];

      await getAllByIds(ids, { attributes });

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: ids,
          },
        },
        attributes,
        raw: true,
      });
    });
    it('should query for only id if not provided with attributes', async () => {
      const ids = Array(3)
        .fill()
        .map(() => uuid.v4());

      await getAllByIds(ids);

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: ids,
          },
        },
        attributes: ['id'],
        raw: true,
      });
    });
    it('should skip query to DB and return empty array if provided with undefined/empty array of ids', async () => {
      const result = await getAllByIds();

      expect(result).toEqual([]);
      expect(db.CompetitionUnitWind.findAll).not.toHaveBeenCalled();
    });
  });
});
