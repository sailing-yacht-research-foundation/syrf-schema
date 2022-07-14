const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  upsert,
  getAll,
  getById,
  getByCompetitionId,
  delete: deleteCourse,
  clear,
  clearPointsByGeometries,
  clearPoints,
  bulkInsertPoints,
  getCourseCompetitionIds,
  getPointById,
  updatePoint,
} = require('../../dataAccess/v1/course');
const { geometryType } = require('../../enums');

const db = require('../../index');
const { getMeta, emptyPagingResponse } = require('../../utils/utils');

describe('Course DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'competitionUnit',
    }),
    expect.objectContaining({
      as: 'courseSequencedGeometries',
      include: [
        expect.objectContaining({
          as: 'points',
          include: [
            expect.objectContaining({
              as: 'tracker',
            }),
          ],
        }),
      ],
    }),
    expect.objectContaining({
      as: 'courseUnsequencedUntimedGeometry',
      include: [
        expect.objectContaining({
          as: 'points',
          include: [
            expect.objectContaining({
              as: 'tracker',
            }),
          ],
        }),
      ],
    }),
    expect.objectContaining({
      as: 'courseUnsequencedTimedGeometry',
      include: [
        expect.objectContaining({
          as: 'points',
          include: [
            expect.objectContaining({
              as: 'tracker',
            }),
          ],
        }),
      ],
    }),
    expect.objectContaining({
      as: 'event',
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'editors',
        }),
        expect.objectContaining({
          as: 'owner',
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
      db.Course.upsert.mockImplementation(async (detail, _transaction) => {
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
      db.Course.upsert.mockReset();
    });
    it('should generate new uuid if not provided, upsert course and clear previous geometries without removing course points', async () => {
      const userId = uuid.v4();
      const data = {
        name: `Course #${faker.random.numeric(1)}`,
        calendarEventId: uuid.v4(),
        createdById: userId,
        createdAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      };

      const result = await upsert(undefined, data, mockTransaction);
      const generatedId = result.id;

      expect(result).toEqual({ ...data, id: expect.any(String) });
      expect(db.Course.upsert).toHaveBeenCalledWith(
        {
          ...data,
          id: expect.any(String),
        },
        { transaction: mockTransaction },
      );
      [
        db.CourseSequencedGeometry.destroy,
        db.CourseUnsequencedTimedGeometry.destroy,
        db.CourseUnsequencedUntimedGeometry.destroy,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            courseId: { [db.Op.in]: [generatedId] },
          },
          transaction: mockTransaction,
        });
      });
      [
        db.CourseSequencedGeometry.findAll,
        db.CourseUnsequencedTimedGeometry.findAll,
        db.CourseUnsequencedUntimedGeometry.findAll,
        db.CoursePoint.destroy,
        db.CourseSequencedGeometry.bulkCreate,
        db.CourseUnsequencedUntimedGeometry.bulkCreate,
        db.CourseUnsequencedTimedGeometry.bulkCreate,
      ].forEach((dbFunc) => {
        expect(dbFunc).not.toHaveBeenCalled();
      });
    });
    it('should use provided id, upsert course and create geometries when provided with', async () => {
      const userId = uuid.v4();
      const courseId = uuid.v4();
      const data = {
        name: `Course #${faker.random.numeric(1)}`,
        calendarEventId: uuid.v4(),
        createdById: userId,
        createdAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
        courseSequencedGeometries: [
          {
            geometryType: geometryType.POINT,
            coordinates: [
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
            ],
          },
        ],
        courseUnsequencedUntimedGeometry: [
          {
            geometryType: geometryType.POLYLINE,
            coordinates: [
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
            ],
          },
          {
            geometryType: geometryType.LINESTRING,
            coordinates: [
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
            ],
          },
        ],
        courseUnsequencedTimedGeometry: [
          {
            geometryType: geometryType.POLYGON,
            coordinates: [
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
            ],
          },
        ],
      };
      const meta = getMeta(data);

      const result = await upsert(courseId, data, mockTransaction);

      expect(result).toEqual({ ...data, id: courseId });
      expect(db.Course.upsert).toHaveBeenCalledWith(
        {
          ...data,
          id: courseId,
        },
        { transaction: mockTransaction },
      );
      [
        db.CourseSequencedGeometry.destroy,
        db.CourseUnsequencedTimedGeometry.destroy,
        db.CourseUnsequencedUntimedGeometry.destroy,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            courseId: { [db.Op.in]: [courseId] },
          },
          transaction: mockTransaction,
        });
      });
      [
        db.CourseSequencedGeometry.findAll,
        db.CourseUnsequencedTimedGeometry.findAll,
        db.CourseUnsequencedUntimedGeometry.findAll,
        db.CoursePoint.destroy,
      ].forEach((dbFunc) => {
        expect(dbFunc).not.toHaveBeenCalled();
      });

      expect(db.CourseSequencedGeometry.bulkCreate).toHaveBeenCalledWith(
        [
          {
            ...data.courseSequencedGeometries[0],
            coordinates: data.courseSequencedGeometries[0].coordinates[0],
            id: expect.any(String),
            courseId,
            ...meta,
          },
        ],
        {
          transaction: mockTransaction,
        },
      );

      expect(
        db.CourseUnsequencedUntimedGeometry.bulkCreate,
      ).toHaveBeenCalledWith(
        [
          {
            ...data.courseUnsequencedUntimedGeometry[0],
            id: expect.any(String),
            courseId,
            ...meta,
          },
          {
            ...data.courseUnsequencedUntimedGeometry[1],
            id: expect.any(String),
            courseId,
            ...meta,
          },
        ],
        {
          transaction: mockTransaction,
        },
      );

      expect(db.CourseUnsequencedTimedGeometry.bulkCreate).toHaveBeenCalledWith(
        [
          {
            ...data.courseUnsequencedTimedGeometry[0],
            coordinates: [data.courseUnsequencedTimedGeometry[0].coordinates],
            id: expect.any(String),
            courseId,
            ...meta,
          },
        ],
        {
          transaction: mockTransaction,
        },
      );
    });
    it('should call upsert & clear successfully without any data', async () => {
      const courseId = uuid.v4();

      const result = await upsert(courseId);

      expect(result).toEqual({ id: courseId });
      expect(db.Course.upsert).toHaveBeenCalledWith(
        { id: courseId },
        { transaction: undefined },
      );
      [
        db.CourseSequencedGeometry.destroy,
        db.CourseUnsequencedTimedGeometry.destroy,
        db.CourseUnsequencedUntimedGeometry.destroy,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            courseId: { [db.Op.in]: [courseId] },
          },
          transaction: null,
        });
      });
    });
  });

  describe('getAll', () => {
    const paging = { page: 1, size: 10 };
    it('should findAllWithPaging on Course based on event id when provided', async () => {
      const params = {
        calendarEventId: uuid.v4(),
      };

      await getAll(paging, params);

      expect(db.Course.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            calendarEventId: params.calendarEventId,
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
    it('should findAllWithPaging on Course based on creator id when provided', async () => {
      const params = {
        userId: uuid.v4(),
      };

      await getAll(paging, params);

      expect(db.Course.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            createdById: params.userId,
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
    it('should not fetch to DB and return empty response if provided with filter without calendar event or user id', async () => {
      const result = await getAll(paging, {});

      expect(result).toEqual(emptyPagingResponse(paging));
      expect(db.Course.findAllWithPaging).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should findByPk on Course with all related geometries when found', async () => {
      const userId = uuid.v4();
      const mockCourse = {
        id: uuid.v4(),
        name: `Course #${faker.random.numeric(1)}`,
        calendarEventId: uuid.v4(),
        createdById: userId,
        createdAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      };
      const courseSequencedGeometries = [
        {
          id: uuid.v4(),
          geometryType: geometryType.POLYLINE,
          order: 1,
          coordinates: [
            [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
            [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
          ],
          points: [
            {
              id: uuid.v4(),
              position: {
                crs: { type: 'name', properties: [] },
                type: 'Point',
                coordinates: [
                  Number(faker.address.longitude()),
                  Number(faker.address.latitude()),
                ],
              },
              order: 1,
            },
            {
              id: uuid.v4(),
              position: {
                crs: { type: 'name', properties: [] },
                type: 'Point',
                coordinates: [
                  Number(faker.address.longitude()),
                  Number(faker.address.latitude()),
                ],
              },
              order: 2,
            },
          ],
        },
      ];
      const courseUnsequencedUntimedGeometry = [
        {
          id: uuid.v4(),
          geometryType: geometryType.POINT,
          order: 1,
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
          points: [
            {
              id: uuid.v4(),
              position: {
                crs: { type: 'name', properties: [] },
                type: 'Point',
                coordinates: [
                  Number(faker.address.longitude()),
                  Number(faker.address.latitude()),
                ],
              },
              order: 1,
            },
          ],
        },
      ];
      // Mocking purpose only, actual polygon should have identical 1st position data and last position data
      const courseUnsequencedTimedGeometry = [
        {
          id: uuid.v4(),
          geometryType: geometryType.POLYGON,
          coordinates: [
            [
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
              [
                Number(faker.address.longitude()),
                Number(faker.address.latitude()),
              ],
            ],
          ],
          order: 1,
          points: Array(5)
            .fill()
            .map((_row, index) => {
              // Mock purpose, points ideally should have the same values as the coordinates
              return {
                id: uuid.v4(),
                position: {
                  crs: { type: 'name', properties: [] },
                  type: 'Point',
                  coordinates: [
                    Number(faker.address.longitude()),
                    Number(faker.address.latitude()),
                  ],
                },
                order: index + 1,
              };
            }),
        },
      ];
      db.Course.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return {
            ...mockCourse,
            courseSequencedGeometries,
            courseUnsequencedUntimedGeometry,
            courseUnsequencedTimedGeometry,
          };
        },
      });

      const result = await getById(mockCourse.id);

      expect(result).toEqual({
        ...mockCourse,
        courseSequencedGeometries: [
          {
            ...courseSequencedGeometries[0],
            points: courseSequencedGeometries[0].points.map((row) => {
              return { ...row, position: row.position.coordinates };
            }),
          },
        ],
        courseUnsequencedUntimedGeometry: [
          {
            ...courseUnsequencedUntimedGeometry[0],
            points: courseUnsequencedUntimedGeometry[0].points.map((row) => {
              return { ...row, position: row.position.coordinates };
            }),
            coordinates: [courseUnsequencedUntimedGeometry[0].coordinates],
          },
        ],
        courseUnsequencedTimedGeometry: [
          {
            ...courseUnsequencedTimedGeometry[0],
            points: courseUnsequencedTimedGeometry[0].points.map((row) => {
              return { ...row, position: row.position.coordinates };
            }),
            coordinates: courseUnsequencedTimedGeometry[0].coordinates[0],
          },
        ],
      });
      expect(db.Course.findByPk).toHaveBeenCalledWith(mockCourse.id, {
        include: defaultIncludeExpectation,
        transaction: undefined,
      });
    });
    it('should return undefined when not found', async () => {
      db.Course.findByPk.mockResolvedValueOnce(undefined);

      const result = await getById(uuid.v4());

      expect(result).toEqual(undefined);
    });
  });

  describe('getByCompetitionId', () => {
    it('should findByPk on CompetitionUnit with course included', async () => {
      const userId = uuid.v4();
      const competitionUnitId = uuid.v4();
      const mockCourse = {
        id: uuid.v4(),
        name: `Course #${faker.random.numeric(1)}`,
        calendarEventId: uuid.v4(),
        createdById: userId,
        createdAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      };
      const courseSequencedGeometries = [
        {
          id: uuid.v4(),
          geometryType: geometryType.LINESTRING,
          order: 1,
          coordinates: [
            [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
            [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
          ],
          points: [
            {
              id: uuid.v4(),
              position: {
                crs: { type: 'name', properties: [] },
                type: 'Point',
                coordinates: [
                  Number(faker.address.longitude()),
                  Number(faker.address.latitude()),
                ],
              },
              order: 1,
            },
            {
              id: uuid.v4(),
              position: {
                crs: { type: 'name', properties: [] },
                type: 'Point',
                coordinates: [
                  Number(faker.address.longitude()),
                  Number(faker.address.latitude()),
                ],
              },
              order: 2,
            },
          ],
        },
      ];
      db.CompetitionUnit.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return {
            course: {
              ...mockCourse,
              courseSequencedGeometries,
              courseUnsequencedUntimedGeometry: undefined,
              courseUnsequencedTimedGeometry: [],
            },
          };
        },
      });

      const result = await getByCompetitionId(competitionUnitId);

      expect(result).toEqual({
        ...mockCourse,
        courseSequencedGeometries: [
          {
            ...courseSequencedGeometries[0],
            points: courseSequencedGeometries[0].points.map((row) => {
              return { ...row, position: row.position.coordinates };
            }),
          },
        ],
        courseUnsequencedUntimedGeometry: [],
        courseUnsequencedTimedGeometry: [],
      });
      expect(db.CompetitionUnit.findByPk).toHaveBeenCalledWith(
        competitionUnitId,
        expect.objectContaining({
          include: [
            expect.objectContaining({
              as: 'course',
              include: defaultIncludeExpectation,
            }),
          ],
          transaction: undefined,
        }),
      );
    });
    it('should return undefined when not found', async () => {
      db.CompetitionUnit.findByPk.mockResolvedValueOnce(undefined);

      const result = await getByCompetitionId(uuid.v4());

      expect(result).toEqual(undefined);
    });
  });

  describe('delete', () => {
    it('should destroy courses, update all competitions using that course, and clear all geometries and points', async () => {
      const courseIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      db.Course.destroy.mockResolvedValueOnce(courseIds.length);

      [
        db.CourseSequencedGeometry.findAll,
        db.CourseUnsequencedTimedGeometry.findAll,
        db.CourseUnsequencedUntimedGeometry.findAll,
      ].forEach((dbFunc) => {
        dbFunc.mockResolvedValueOnce([{ id: uuid.v4() }]);
      });
      const result = await deleteCourse(courseIds, mockTransaction);

      expect(result).toEqual(courseIds.length);
      expect(db.Course.findByPk).not.toHaveBeenCalled();
      expect(db.Course.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: courseIds,
          },
        },
        transaction: mockTransaction,
      });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        { courseId: null },
        {
          where: {
            courseId: {
              [db.Op.in]: courseIds,
            },
          },
          transaction: mockTransaction,
        },
      );
      [
        db.CourseSequencedGeometry.findAll,
        db.CourseUnsequencedTimedGeometry.findAll,
        db.CourseUnsequencedUntimedGeometry.findAll,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              courseId: { [db.Op.in]: courseIds },
            },
          }),
        );
      });
      [
        db.CourseSequencedGeometry.destroy,
        db.CourseUnsequencedTimedGeometry.destroy,
        db.CourseUnsequencedUntimedGeometry.destroy,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            courseId: { [db.Op.in]: courseIds },
          },
          transaction: mockTransaction,
        });
      });
      expect(db.CoursePoint.destroy).toHaveBeenCalledTimes(1);
    });
    it('should work if provided with single course id and return the detail of course', async () => {
      db.Course.destroy.mockResolvedValueOnce(1);
      const userId = uuid.v4();
      const mockCourse = {
        id: uuid.v4(),
        name: `Course #${faker.random.numeric(1)}`,
        calendarEventId: uuid.v4(),
        createdById: userId,
        createdAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      };
      db.Course.findByPk.mockResolvedValueOnce({
        toJSON: () => {
          return {
            ...mockCourse,
            courseSequencedGeometries: [],
            courseUnsequencedUntimedGeometry: [],
            courseUnsequencedTimedGeometry: [],
          };
        },
      });
      [
        db.CourseSequencedGeometry.findAll,
        db.CourseUnsequencedTimedGeometry.findAll,
        db.CourseUnsequencedUntimedGeometry.findAll,
      ].forEach((dbFunc) => {
        dbFunc.mockResolvedValueOnce([]);
      });
      const courseId = uuid.v4();
      const result = await deleteCourse(courseId, mockTransaction);

      expect(result).toEqual({
        ...mockCourse,
        courseSequencedGeometries: [],
        courseUnsequencedUntimedGeometry: [],
        courseUnsequencedTimedGeometry: [],
      });
      expect(db.Course.findByPk).toHaveBeenCalledTimes(1);
      expect(db.Course.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: [courseId],
          },
        },
        transaction: mockTransaction,
      });
      expect(db.CompetitionUnit.update).toHaveBeenCalledWith(
        { courseId: null },
        {
          where: {
            courseId: {
              [db.Op.in]: [courseId],
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
      expect(db.Course.destroy).toHaveBeenCalledWith({
        truncate: true,
        cascade: true,
        force: true,
      });
    });
  });

  describe('clearPointsByGeometries', () => {
    it('should destroy CoursePoint using geometryId', async () => {
      const geometryIds = Array(3)
        .fill()
        .map(() => uuid.v4());

      await clearPointsByGeometries(geometryIds, mockTransaction);

      expect(db.CoursePoint.destroy).toHaveBeenCalledWith({
        where: {
          geometryId: { [db.Op.in]: geometryIds },
        },
        transaction: mockTransaction,
      });
    });
    it('should skip destroy if not provided with any id', async () => {
      await clearPointsByGeometries(undefined, mockTransaction);

      expect(db.CoursePoint.destroy).not.toHaveBeenCalled();
    });
  });

  describe('clearPoints', () => {
    it('should destroy CoursePoint using id', async () => {
      const ids = Array(3)
        .fill()
        .map(() => uuid.v4());

      await clearPoints(ids, mockTransaction);

      expect(db.CoursePoint.destroy).toHaveBeenCalledWith({
        where: {
          id: { [db.Op.in]: ids },
        },
        transaction: mockTransaction,
      });
    });
    it('should skip destroy if not provided with any id', async () => {
      await clearPoints(undefined, mockTransaction);

      expect(db.CoursePoint.destroy).not.toHaveBeenCalled();
    });
  });

  describe('bulkInsertPoints', () => {
    it('should call bulkCreate on CoursePoint', async () => {
      const points = [
        {
          id: uuid.v4(),
          position: {
            crs: { type: 'name', properties: [] },
            type: 'Point',
            coordinates: [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
          },
          order: 1,
        },
      ];
      db.CoursePoint.bulkCreate.mockResolvedValueOnce(points);
      const result = await bulkInsertPoints(points, mockTransaction);

      expect(result).toEqual(points);
      expect(db.CoursePoint.bulkCreate).toHaveBeenCalledWith(points, {
        transaction: mockTransaction,
      });
    });
    it('should skip DB call and return empty array if provided with nothing', async () => {
      const result = await bulkInsertPoints();

      expect(result).toEqual([]);
      expect(db.CoursePoint.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('getCourseCompetitionIds', () => {
    it('should findAll on CompetitionUnit with courseId', async () => {
      const courseId = uuid.v4();
      const competitionIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      const mockCompetitions = competitionIds.map((id) => {
        return { id };
      });
      db.CompetitionUnit.findAll.mockResolvedValueOnce(mockCompetitions);

      const result = await getCourseCompetitionIds(courseId);

      expect(result).toEqual(competitionIds);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            courseId,
          },
          raw: true,
        }),
      );
    });
  });

  describe('getPointById', () => {
    it('should findByPk on CoursePoint', async () => {
      const pointId = uuid.v4();
      const mockPoint = {
        id: uuid.v4(),
        position: {
          crs: { type: 'name', properties: [] },
          type: 'Point',
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
          sequenced: [],
          timed: [],
          unsequenced: [],
        },
        order: 1,
      };
      db.CoursePoint.findByPk.mockResolvedValueOnce({
        toJSON: () => mockPoint,
      });

      const result = await getPointById(pointId);

      expect(result).toEqual(mockPoint);
      expect(db.CoursePoint.findByPk).toHaveBeenCalledWith(pointId, {
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'sequenced',
            include: [
              expect.objectContaining({
                as: 'course',
              }),
            ],
          }),
          expect.objectContaining({
            as: 'timed',
            include: [
              expect.objectContaining({
                as: 'course',
              }),
            ],
          }),
          expect.objectContaining({
            as: 'unsequenced',
            include: [
              expect.objectContaining({
                as: 'course',
              }),
            ],
          }),
        ]),
        transaction: undefined,
      });
    });
  });

  describe('updatePoint', () => {
    it('should update point data', async () => {
      const pointId = uuid.v4();
      const data = {
        position: [
          Number(faker.address.longitude()),
          Number(faker.address.latitude()),
        ],
        order: 1,
        properties: {},
        markTrackerId: uuid.v4(),
        updatedById: uuid.v4(),
        updatedAt: new Date(),
      };
      db.CoursePoint.update.mockResolvedValueOnce([1, undefined]);

      const result = await updatePoint(pointId, data, mockTransaction);

      expect(result).toEqual([1, undefined]);
      expect(db.CoursePoint.update).toHaveBeenCalledWith(
        {
          ...data,
          position: {
            type: 'Point',
            coordinates: [data.position[0], data.position[1]],
          },
        },
        {
          where: {
            id: pointId,
          },
          transaction: mockTransaction,
        },
      );
    });
    it('should work without any data and fill position as null', async () => {
      const pointId = uuid.v4();
      db.CoursePoint.update.mockResolvedValueOnce([1, undefined]);

      const result = await updatePoint(pointId, undefined, mockTransaction);

      expect(result).toEqual([1, undefined]);
      expect(db.CoursePoint.update).toHaveBeenCalledWith(
        {
          position: null,
        },
        {
          where: {
            id: pointId,
          },
          transaction: mockTransaction,
        },
      );
    });
  });
});
