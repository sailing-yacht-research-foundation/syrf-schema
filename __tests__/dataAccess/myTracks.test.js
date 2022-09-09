const { faker } = require('@faker-js/faker');
const uuid = require('uuid');
const { MY_TRACK_NAME_SEPARATOR } = require('../../constants');

const {
  getMyTracks,
  getById,
  getTracksGeoJson,
  getTrackTime,
  getMyTrackByCompetition,
  addMyTrack,
  addCrewTrackJson,
  getActiveTrack,
  getCrewTrackByTrackId,
  getActiveTrackByUserId,
  updateTrack,
  deleteEmptyTracksByCompetitionUnitId,
  deleteTrackJsonById,
} = require('../../dataAccess/v1/myTracks');

const db = require('../../index');

describe('My Track DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });
  describe('getMyTracks', () => {
    const userId = uuid.v4();
    const commonExpectedInclude = [
      expect.objectContaining({
        as: 'group',
        attributes: expect.arrayContaining(['id', 'vesselParticipantGroupId']),
      }),
      expect.objectContaining({
        as: 'vesselParticipant',
        attributes: expect.arrayContaining(['id']),
        include: [
          expect.objectContaining({
            paranoid: false,
            as: 'vessel',
            attributes: expect.arrayContaining([
              'id',
              'globalId',
              'publicName',
            ]),
          }),
        ],
      }),
      expect.objectContaining({
        as: 'participant',
        attributes: expect.arrayContaining(['id', 'publicName']),
        where: {
          userProfileId: userId,
        },
      }),
      expect.objectContaining({
        as: 'competitionUnit',
        required: true,
      }),
      expect.objectContaining({
        as: 'trackJson',
        attributes: [
          'id',
          'totalTraveledDistance',
          'firstPosition',
          'startTime',
          'endTime',
          'locationUpdateCount',
        ],
        where: {
          competitionUnitId: {
            [db.Op.eq]: db.Sequelize.col('TrackHistory.competitionUnitId'),
          },
        },
      }),
    ];
    it('should bind filter with wildcard if provided with non-eq filter to TrackHistory', async () => {
      const paging = {
        page: 1,
        size: 10,
        filters: [{ field: 'name', opr: 'contains', value: 'test' }],
      };
      const trackHistories = {
        count: 0,
        rows: [],
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      };
      db.TrackHistory.findAllWithPaging.mockResolvedValueOnce(trackHistories);

      const result = await getMyTracks(userId, undefined, paging);

      expect(result).toEqual(trackHistories);
      expect(db.TrackHistory.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          bind: {
            filter_value: '%test%',
          },
          include: [
            expect.objectContaining({
              as: 'event',
              required: true,
            }),
            ...commonExpectedInclude,
          ],
        }),
        expect.objectContaining({
          ...paging,
          customCountField: `"trackJson"."id"`,
        }),
      );
    });
    it('should bind filter with exact value and add where condition on event if provided with isPrivate field', async () => {
      const isPrivate = false;
      const paging = {
        page: 1,
        size: 10,
        filters: [{ field: 'name', opr: 'eq', value: 'test' }],
      };
      const trackHistories = {
        count: 0,
        rows: [],
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      };
      db.TrackHistory.findAllWithPaging.mockResolvedValueOnce(trackHistories);

      const result = await getMyTracks(userId, isPrivate, paging);

      expect(result).toEqual(trackHistories);
      expect(db.TrackHistory.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          bind: {
            filter_value: 'test',
          },
          include: [
            expect.objectContaining({
              as: 'event',
              required: true,
              where: { isPrivate },
            }),
            ...commonExpectedInclude,
          ],
        }),
        expect.objectContaining({
          ...paging,
          customCountField: `"trackJson"."id"`,
        }),
      );
    });
    it('should set bind to undefined when no filter specified, and handle track name', async () => {
      const paging = {
        page: 1,
        size: 10,
        filters: [],
      };
      const trackData1 = {
        id: uuid.v4(),
        event: {
          id: uuid.v4(),
          name: `Event ${faker.random.numeric(2)}`,
        },
        competitionUnit: {
          id: uuid.v4(),
          name: `Race #${faker.random.numeric(2)}`,
        },
      };
      const trackData2 = {
        id: uuid.v4(),
        event: {
          id: uuid.v4(),
          name: 'Identical Name RaceEvent',
        },
        competitionUnit: {
          id: uuid.v4(),
          name: 'Identical Name RaceEvent',
        },
      };
      const trackData3 = {
        id: uuid.v4(),
        event: {
          id: uuid.v4(),
        },
        competitionUnit: {
          id: uuid.v4(),
        },
      };
      const trackHistories = {
        count: 3,
        rows: [
          {
            toJSON: () => {
              return trackData1;
            },
          },
          {
            toJSON: () => {
              return trackData2;
            },
          },
          {
            toJSON: () => {
              return trackData3;
            },
          },
        ],
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      };
      db.TrackHistory.findAllWithPaging.mockResolvedValueOnce(trackHistories);

      const result = await getMyTracks(userId, undefined, paging);

      expect(result).toEqual({
        ...trackHistories,
        rows: trackHistories.rows.map((row, index) => {
          const data = row.toJSON();
          let expectedName = [data.event.name, data.competitionUnit.name].join(
            MY_TRACK_NAME_SEPARATOR,
          );
          if (index === 1) {
            expectedName = data.event.name;
          }
          if (index === 2) {
            expectedName = '';
          }
          return { ...row.toJSON(), name: expectedName };
        }),
      });
      expect(db.TrackHistory.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          bind: undefined,
          include: [
            expect.objectContaining({
              as: 'event',
              required: true,
            }),
            ...commonExpectedInclude,
          ],
        }),
        expect.objectContaining({
          ...paging,
          customCountField: `"trackJson"."id"`,
        }),
      );
    });
    it('should use custom literal sort if sorted by name field', async () => {
      const paging = {
        page: 1,
        size: 10,
        filters: [],
        sort: 'name',
        srdir: 1,
      };
      const trackHistories = {
        count: 0,
        rows: [],
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'ASC',
        q: '',
        filters: [],
      };
      db.TrackHistory.findAllWithPaging.mockResolvedValueOnce(trackHistories);

      const result = await getMyTracks(userId, undefined, paging);

      expect(result).toEqual(trackHistories);
      expect(db.TrackHistory.findAllWithPaging).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...paging,
          customCountField: `"trackJson"."id"`,
          sort: {
            custom: db.Sequelize.literal(
              `"event"."name" ASC, "competitionUnit"."name" ASC`,
            ),
            fieldName: 'name',
          },
        }),
      );
    });
    it('should use custom literal sort if multi sorted by name field', async () => {
      const paging = {
        page: 1,
        size: 10,
        filters: [],
        multiSort: [['name', 'ASC']],
      };
      const trackHistories = {
        count: 0,
        rows: [],
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'ASC',
        q: '',
        filters: [],
      };
      db.TrackHistory.findAllWithPaging.mockResolvedValueOnce(trackHistories);

      const result = await getMyTracks(userId, undefined, paging);

      expect(result).toEqual(trackHistories);
      expect(db.TrackHistory.findAllWithPaging).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          multiSort: [
            db.Sequelize.literal(
              `"event"."name" ASC, "competitionUnit"."name" ASC`,
            ),
          ],
        }),
      );
    });
  });

  describe('getById', () => {
    it('should call findByPk on TrackHistory', async () => {
      const mockTrackHistory = {
        id: uuid.v4(),
        competitionUnitId: uuid.v4(),
        calendarEventId: uuid.v4(),
        vesselParticipantid: uuid.v4(),
        // etc
      };
      db.TrackHistory.findByPk.mockResolvedValueOnce({
        toJSON: () => mockTrackHistory,
      });

      const result = await getById(mockTrackHistory.id);

      expect(result).toEqual(mockTrackHistory);
      expect(db.TrackHistory.findByPk).toHaveBeenCalledWith(
        mockTrackHistory.id,
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'event',
              required: true,
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'editors',
                  attributes: expect.arrayContaining(['id', 'name']),
                }),
              ]),
            }),
            expect.objectContaining({
              as: 'group',
              attributes: expect.arrayContaining([
                'id',
                'vesselParticipantGroupId',
              ]),
            }),
            expect.objectContaining({
              as: 'vesselParticipant',
              attributes: ['id'],
              include: expect.arrayContaining([
                expect.objectContaining({
                  paranoid: false,
                  as: 'vessel',
                  attributes: expect.arrayContaining([
                    'id',
                    'globalId',
                    'publicName',
                  ]),
                }),
              ]),
            }),
            expect.objectContaining({
              as: 'participant',
              attributes: ['id', 'publicName'],
            }),
            expect.objectContaining({
              as: 'competitionUnit',
            }),
          ]),
        },
      );
    });
  });

  describe('getTracksGeoJson', () => {
    const mockTrackHistory = {
      id: uuid.v4(),
      userProfileId: uuid.v4(),
      crewId: uuid.v4(),
      competitionUnitId: uuid.v4(),
      phoneModel: 'iphone',
      phoneOS: 'ios',
    };
    const mockTrackJson = {
      id: uuid.v4(),
      vesselParticipantCrewId: mockTrackHistory.crewId,
      competitionUnitId: mockTrackHistory.competitionUnitId,
      storageKey: 'path/to/file',
    };
    it('should return Track geojson and phone model/os of a selected track id and selected track json', async () => {
      db.TrackHistory.findOne.mockResolvedValueOnce(mockTrackHistory);
      db.VesselParticipantCrewTrackJson.findOne.mockResolvedValueOnce(
        mockTrackJson,
      );

      const result = await getTracksGeoJson(
        {
          trackId: mockTrackHistory.id,
          trackJsonId: mockTrackJson.id,
        },
        mockTrackHistory.userProfileId,
      );

      expect(result).toEqual({
        storageKey: mockTrackJson.storageKey,
        vesselParticipantCrewId: mockTrackJson.vesselParticipantCrewId,
        phoneModel: mockTrackHistory.phoneModel,
        phoneOS: mockTrackHistory.phoneOS,
      });
      expect(db.VesselParticipantCrewTrackJson.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vesselParticipantCrewId: mockTrackHistory.crewId,
            competitionUnitId: mockTrackHistory.competitionUnitId,
            id: mockTrackJson.id,
          },
          raw: true,
        }),
      );
    });
    it('should return Track geojson and phone model/os of a selected track id', async () => {
      db.TrackHistory.findOne.mockResolvedValueOnce(mockTrackHistory);
      db.VesselParticipantCrewTrackJson.findOne.mockResolvedValueOnce(
        mockTrackJson,
      );

      const result = await getTracksGeoJson(
        {
          trackId: mockTrackHistory.id,
        },
        mockTrackHistory.userProfileId,
      );

      expect(result).toEqual({
        storageKey: mockTrackJson.storageKey,
        vesselParticipantCrewId: mockTrackJson.vesselParticipantCrewId,
        phoneModel: mockTrackHistory.phoneModel,
        phoneOS: mockTrackHistory.phoneOS,
      });
      expect(db.VesselParticipantCrewTrackJson.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vesselParticipantCrewId: mockTrackHistory.crewId,
            competitionUnitId: mockTrackHistory.competitionUnitId,
          },
          raw: true,
        }),
      );
    });
    it('should immediately return null if user/trackId not provided', async () => {
      const result = await getTracksGeoJson({}, mockTrackHistory.userProfileId);

      expect(result).toEqual(null);
      expect(db.TrackHistory.findOne).not.toHaveBeenCalled();
      expect(db.VesselParticipantCrewTrackJson.findOne).not.toHaveBeenCalled();
    });
    it('should null if track history not found', async () => {
      db.TrackHistory.findOne.mockResolvedValueOnce(undefined);

      const result = await getTracksGeoJson(
        {
          trackId: uuid.v4(),
        },
        mockTrackHistory.userProfileId,
      );

      expect(result).toEqual(null);
      expect(db.VesselParticipantCrewTrackJson.findOne).not.toHaveBeenCalled();
    });
    it('should null if track json not found', async () => {
      db.TrackHistory.findOne.mockResolvedValueOnce(mockTrackHistory);
      db.TrackHistory.findOne.mockResolvedValueOnce(undefined);

      const result = await getTracksGeoJson(
        {
          trackId: mockTrackHistory.id,
          trackJsonId: uuid.v4(),
        },
        mockTrackHistory.userProfileId,
      );

      expect(result).toEqual(null);
      expect(db.VesselParticipantCrewTrackJson.findOne).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('getTrackTime', () => {
    it('should return the track start time and end time', async () => {
      const mockTrackHistory = {
        id: uuid.v4(),
        userProfileId: uuid.v4(),
        crewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        phoneModel: 'iphone',
        phoneOS: 'ios',
      };
      const mockTrackJson = {
        id: uuid.v4(),
        vesselParticipantCrewId: mockTrackHistory.crewId,
        competitionUnitId: mockTrackHistory.competitionUnitId,
        storageKey: 'path/to/file',
      };
      db.TrackHistory.findByPk.mockResolvedValueOnce(mockTrackHistory);
      db.VesselParticipantCrewTrackJson.findAll.mockResolvedValueOnce([
        mockTrackJson,
      ]);
      const result = await getTrackTime(mockTrackHistory.id);

      expect(result).toEqual(mockTrackJson);
      expect(db.TrackHistory.findByPk).toHaveBeenCalledWith(
        mockTrackHistory.id,
      );
      expect(db.VesselParticipantCrewTrackJson.findAll).toHaveBeenCalledWith({
        where: {
          vesselParticipantCrewId: mockTrackHistory.crewId,
          competitionUnitId: mockTrackHistory.competitionUnitId,
        },
        attributes: expect.arrayContaining([
          [db.Sequelize.fn('min', db.Sequelize.col('startTime')), 'startTime'],
          [db.Sequelize.fn('max', db.Sequelize.col('endTime')), 'endTime'],
        ]),
      });
    });
    it('should immediately return null when provided with falsy value', async () => {
      const result = await getTrackTime('');

      expect(result).toEqual(null);
      expect(db.TrackHistory.findByPk).not.toHaveBeenCalled();
    });
  });

  describe('getMyTrackByCompetition', () => {
    it('should findOne TrackHistory using user id and competition id', async () => {
      const userProfileId = uuid.v4();
      const competitionUnitId = uuid.v4();
      await getMyTrackByCompetition(userProfileId, competitionUnitId);

      expect(db.TrackHistory.findOne).toHaveBeenCalledWith({
        where: { userProfileId, competitionUnitId },
      });
    });
  });

  describe('addMyTrack', () => {
    it('should upsertTrackHistory using provided data  and create random uuid if not provided', async () => {
      const data = {
        userProfileId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        crewId: uuid.v4(),
        // etc
      };
      db.TrackHistory.upsert.mockResolvedValueOnce([
        {
          toJSON: () => {
            return { id: uuid.v4(), ...data };
          },
        },
      ]);

      const result = await addMyTrack(undefined, data, mockTransaction);

      expect(result).toEqual({
        id: expect.any(String),
        ...data,
      });
      expect(db.TrackHistory.upsert).toHaveBeenCalledWith(
        {
          id: expect.any(String),
          ...data,
        },
        { transaction: mockTransaction },
      );
    });
    it('should not create random uuid if provided', async () => {
      const trackId = uuid.v4();
      const data = {
        userProfileId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        crewId: uuid.v4(),
      };
      db.TrackHistory.upsert.mockResolvedValueOnce([
        {
          toJSON: () => {
            return { id: trackId, ...data };
          },
        },
      ]);

      const result = await addMyTrack(trackId, data, mockTransaction);

      expect(result).toEqual({
        id: trackId,
        ...data,
      });
      expect(db.TrackHistory.upsert).toHaveBeenCalledWith(
        {
          id: trackId,
          ...data,
        },
        { transaction: mockTransaction },
      );
    });
  });

  describe('addCrewTrackJson', () => {
    it('should call create on VesselParticipantCrewTrackJson', async () => {
      const data = {
        id: uuid.v4(),
        vesselParticipantCrewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        storageKey: 'path/to/file',
      };
      db.VesselParticipantCrewTrackJson.create.mockResolvedValueOnce(data);

      const result = await addCrewTrackJson(data, mockTransaction);

      expect(result).toEqual(data);
      expect(db.VesselParticipantCrewTrackJson.create).toHaveBeenCalledWith(
        data,
        { validate: true, transaction: mockTransaction },
      );
    });
  });

  describe('getActiveTrack', () => {
    it('should call findOne on VesselParticipantCrewTrackJson', async () => {
      const mockTrackJson = {
        id: uuid.v4(),
        vesselParticipantCrewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        storageKey: 'path/to/file',
      };
      db.VesselParticipantCrewTrackJson.findOne.mockResolvedValueOnce(
        mockTrackJson,
      );

      const result = await getActiveTrack(
        mockTrackJson.competitionUnitId,
        mockTrackJson.vesselParticipantCrewId,
      );

      expect(result).toEqual(mockTrackJson);
      expect(db.VesselParticipantCrewTrackJson.findOne).toHaveBeenCalledWith({
        where: {
          competitionUnitId: mockTrackJson.competitionUnitId,
          vesselParticipantCrewId: mockTrackJson.vesselParticipantCrewId,
          endTime: null,
        },
        raw: true,
      });
    });
  });

  describe('getCrewTrackByTrackId', () => {
    it('should findByPk on VesselParticipantCrewTrackJson', async () => {
      const data = {
        id: uuid.v4(),
        vesselParticipantCrewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        storageKey: 'path/to/file',
      };
      db.VesselParticipantCrewTrackJson.findByPk.mockResolvedValueOnce({
        toJSON: () => data,
      });

      const result = await getCrewTrackByTrackId(data.id);

      expect(result).toEqual(result);
      expect(db.VesselParticipantCrewTrackJson.findByPk).toHaveBeenCalledWith(
        data.id,
        {
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'crew',
              attributes: expect.arrayContaining(['id', 'vesselParticipantId']),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'participant',
                  attributes: ['id', 'userProfileId', 'calendarEventId'],
                }),
              ]),
            }),
            expect.objectContaining({
              as: 'competition',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'startTime',
                'endTime',
                'status',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'calendarEvent',
                  attributes: expect.arrayContaining(['id', 'name', 'status']),
                }),
              ]),
            }),
          ]),
        },
      );
    });
  });

  describe('getActiveTrackByUserId', () => {
    it('should findAllWithPaging on VesselParticipantCrewTrackJson', async () => {
      const crewTrackJsons = {
        count: 0,
        rows: [],
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      };
      db.VesselParticipantCrewTrackJson.findAllWithPaging.mockResolvedValueOnce(
        crewTrackJsons,
      );
      const userId = uuid.v4();
      const paging = { page: 1, size: 10 };

      const result = await getActiveTrackByUserId(userId, paging);

      expect(result).toEqual(crewTrackJsons);
      expect(
        db.VesselParticipantCrewTrackJson.findAllWithPaging,
      ).toHaveBeenCalledWith(
        {
          where: {
            endTime: null,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'crew',
              attributes: ['id', 'vesselParticipantId'],
              required: true,
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'participant',
                  required: true,
                  attributes: expect.arrayContaining([
                    'id',
                    'userProfileId',
                    'calendarEventId',
                  ]),
                  where: {
                    userProfileId: userId,
                  },
                }),
              ]),
            }),
            expect.objectContaining({
              as: 'competition',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'startTime',
                'status',
              ]),
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'calendarEvent',
                  attributes: expect.arrayContaining(['id', 'name', 'status']),
                }),
              ]),
            }),
          ]),
        },
        {
          ...paging,
          defaultSort: [
            ['endTime', 'DESC NULLS FIRST'],
            ['startTime', 'DESC NULLS LAST'],
          ],
        },
      );
    });
  });

  describe('updateTrack', () => {
    it('should update on VesselParticipantCrewTrackJson', async () => {
      const data = {
        id: uuid.v4(),
        vesselParticipantCrewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
        storageKey: 'path/to/file',
      };
      db.VesselParticipantCrewTrackJson.update.mockResolvedValueOnce([
        1,
        undefined,
      ]);

      const result = await updateTrack(data.id, data, mockTransaction);

      expect(result).toEqual([1, undefined]);
      expect(db.VesselParticipantCrewTrackJson.update).toHaveBeenCalledWith(
        data,
        {
          where: {
            id: data.id,
          },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('deleteEmptyTracksByCompetitionUnitId', () => {
    it('should delete empty tracks by competition unit id', async () => {
      const data = {
        id: uuid.v4(),
      };
      const emptyTracks = Array.from(Array(10)).map(() => ({
        vesselParticipantCrewId: uuid.v4(),
      }));
      db.VesselParticipantCrewTrackJson.findAll.mockResolvedValueOnce(
        emptyTracks,
      );

      const arbitraryJson = JSON.parse(faker.datatype.json());
      db.TrackHistory.destroy.mockResolvedValueOnce(arbitraryJson);
      db.VesselParticipantCrewTrackJson.destroy.mockResolvedValueOnce(
        arbitraryJson,
      );

      const result = await deleteEmptyTracksByCompetitionUnitId(
        data.id,
        mockTransaction,
      );

      expect(result).toEqual([arbitraryJson, arbitraryJson]);
      expect(db.TrackHistory.destroy).toHaveBeenCalledWith({
        where: {
          competitionUnitId: data.id,
          crewId: {
            [db.Op.in]: emptyTracks.map((t) => t.vesselParticipantCrewId),
          },
        },
        transaction: mockTransaction,
      });
      expect(db.VesselParticipantCrewTrackJson.destroy).toHaveBeenCalledWith({
        where: {
          competitionUnitId: data.id,
          endTime: null,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('deleteTrackJsonById', () => {
    it('should delete tracks by id', async () => {
      const mockTrackJson = {
        id: uuid.v4(),
        vesselParticipantCrewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
      };

      db.VesselParticipantCrewTrackJson.findByPk.mockResolvedValueOnce(
        mockTrackJson,
      );
      db.VesselParticipantCrewTrackJson.count.mockResolvedValueOnce(0);
      db.VesselParticipantCrewTrackJson.destroy.mockResolvedValueOnce(1);

      const result = await deleteTrackJsonById(
        mockTrackJson.id,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.TrackHistory.destroy).toHaveBeenCalledWith({
        where: {
          crewId: mockTrackJson.vesselParticipantCrewId,
          competitionUnitId: mockTrackJson.competitionUnitId,
        },
        transaction: mockTransaction,
      });
      expect(db.VesselParticipantCrewTrackJson.destroy).toHaveBeenCalledWith({
        where: { id: mockTrackJson.id },
        transaction: mockTransaction,
      });
    });

    it('should not delete my tracks if used by other track', async () => {
      const mockTrackJson = {
        id: uuid.v4(),
        vesselParticipantCrewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
      };

      db.VesselParticipantCrewTrackJson.findByPk.mockResolvedValueOnce(
        mockTrackJson,
      );
      db.VesselParticipantCrewTrackJson.count.mockResolvedValueOnce(1);
      db.VesselParticipantCrewTrackJson.destroy.mockResolvedValueOnce(1);

      const result = await deleteTrackJsonById(
        mockTrackJson.id,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.TrackHistory.destroy).not.toHaveBeenCalled();
      expect(db.VesselParticipantCrewTrackJson.destroy).toHaveBeenCalledWith({
        where: { id: mockTrackJson.id },
        transaction: mockTransaction,
      });
    });

    it('immediately returns when not found', async () => {
      const mockTrackJson = {
        id: uuid.v4(),
        vesselParticipantCrewId: uuid.v4(),
        competitionUnitId: uuid.v4(),
      };

      db.VesselParticipantCrewTrackJson.findByPk.mockResolvedValueOnce(null);

      const result = await deleteTrackJsonById(
        mockTrackJson.id,
        mockTransaction,
      );

      expect(result).toEqual(0);
      expect(db.TrackHistory.destroy).not.toHaveBeenCalled();
      expect(db.VesselParticipantCrewTrackJson.destroy).not.toHaveBeenCalled();
    });
  });
});
