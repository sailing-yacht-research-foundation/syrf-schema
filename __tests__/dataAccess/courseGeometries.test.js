const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  setSequencedGeometries,
  setUnsequencedGeometries,
  setTimedGeometries,
  clearSequenced,
  clearUnsequenced,
  clearTimed,
  upsertCourse,
  getSequencedByCourseId,
  getUnsequencedByCourseId,
  getTimedByCourseId,
  getSequencedByCompetitionId,
  getUnsequencedByCompetitionId,
  getTimedByCompetitionId,
  clearPoints,
  bulkInsertPoints,
} = require('../../dataAccess/v1/courseGeometries');
const dal = require('../../dataAccess/v1/courseGeometries');
const { geometryType } = require('../../enums');

const db = require('../../index');

describe('Course Geometries DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  const defaultIncludeExpectation = expect.arrayContaining([
    expect.objectContaining({
      as: 'points',
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'tracker',
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
  describe('setSequencedGeometries', () => {
    const courseId = uuid.v4();
    let spyClear = null;
    beforeAll(() => {
      spyClear = jest.spyOn(dal, 'clearSequenced').mockResolvedValueOnce(1);
    });
    afterAll(() => {
      spyClear.mockReset();
    });
    it('should bulkCreate CourseSequencedGeometry', async () => {
      const geometries = [
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
          geometryType: geometryType.POINT,
          coordinates: [
            [
              Number(faker.address.longitude()),
              Number(faker.address.latitude()),
            ],
          ],
        },
      ];
      const result = await setSequencedGeometries(
        courseId,
        geometries,
        mockTransaction,
      );

      expect(result).toEqual(geometries);
      expect(spyClear).toHaveBeenCalledWith(courseId, mockTransaction);
      expect(db.CourseSequencedGeometry.bulkCreate).toHaveBeenCalledWith(
        [
          { ...geometries[0], id: expect.any(String), courseId },
          {
            ...geometries[1],
            coordinates: geometries[1].coordinates[0],
            id: expect.any(String),
            courseId,
          },
        ],
        {
          transaction: mockTransaction,
        },
      );
    });
    it('should skip bulkCreate if not provided with any geometries', async () => {
      const result = await setSequencedGeometries(
        courseId,
        undefined,
        mockTransaction,
      );

      expect(result).toEqual([]);
      expect(spyClear).toHaveBeenCalledWith(courseId, mockTransaction);
      expect(db.CourseSequencedGeometry.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('setUnsequencedGeometries', () => {
    const courseId = uuid.v4();
    let spyClear = null;
    beforeAll(() => {
      spyClear = jest.spyOn(dal, 'clearUnsequenced').mockResolvedValueOnce(1);
    });
    afterAll(() => {
      spyClear.mockReset();
    });
    it('should bulkCreate CourseUnsequencedUntimedGeometry', async () => {
      const geometries = [
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
        // Note:
        // These 2 below is just for code coverage
        // However it seems these should never happen, as we require coordinates to save in DB
        {
          geometryType: geometryType.POINT,
          coordinates: [],
        },
        {
          geometryType: geometryType.POINT,
          coordinates: undefined,
        },
      ];
      const result = await setUnsequencedGeometries(
        courseId,
        geometries,
        mockTransaction,
      );

      expect(result).toEqual(geometries);
      expect(spyClear).toHaveBeenCalledWith(courseId, mockTransaction);
      expect(
        db.CourseUnsequencedUntimedGeometry.bulkCreate,
      ).toHaveBeenCalledWith(
        [
          {
            ...geometries[0],
            coordinates: [geometries[0].coordinates],
            id: expect.any(String),
            courseId,
          },
          {
            ...geometries[1],
            coordinates: [],
            id: expect.any(String),
            courseId,
          },
          {
            ...geometries[2],
            id: expect.any(String),
            courseId,
          },
        ],
        {
          transaction: mockTransaction,
        },
      );
    });

    it('should skip bulkCreate if not provided with any geometries', async () => {
      const result = await setUnsequencedGeometries(
        courseId,
        undefined,
        mockTransaction,
      );

      expect(result).toEqual([]);
      expect(spyClear).toHaveBeenCalledWith(courseId, mockTransaction);
      expect(
        db.CourseUnsequencedUntimedGeometry.bulkCreate,
      ).not.toHaveBeenCalled();
    });
  });

  describe('setTimedGeometries', () => {
    const courseId = uuid.v4();
    let spyClear = null;
    beforeAll(() => {
      spyClear = jest.spyOn(dal, 'clearTimed').mockResolvedValueOnce(1);
    });
    afterAll(() => {
      spyClear.mockReset();
    });
    it('should bulkCreate CourseUnsequencedTimedGeometry', async () => {
      const geometries = [
        {
          geometryType: geometryType.POINT,
          coordinates: [
            Number(faker.address.longitude()),
            Number(faker.address.latitude()),
          ],
        },
      ];
      const result = await setTimedGeometries(
        courseId,
        geometries,
        mockTransaction,
      );

      expect(result).toEqual(geometries);
      expect(spyClear).toHaveBeenCalledWith(courseId, mockTransaction);
      expect(db.CourseUnsequencedTimedGeometry.bulkCreate).toHaveBeenCalledWith(
        [
          {
            ...geometries[0],
            coordinates: geometries[0].coordinates[0],
            id: expect.any(String),
            courseId,
          },
        ],
        {
          transaction: mockTransaction,
        },
      );
    });
    it('should bulkCreate CourseUnsequencedTimedGeometry', async () => {
      const result = await setTimedGeometries(
        courseId,
        undefined,
        mockTransaction,
      );

      expect(result).toEqual([]);
      expect(spyClear).toHaveBeenCalledWith(courseId, mockTransaction);
      expect(
        db.CourseUnsequencedTimedGeometry.bulkCreate,
      ).not.toHaveBeenCalled();
    });
  });

  describe('clearSequenced', () => {
    it('should call destroy on CourseSequencedGeometry', async () => {
      const courseId = uuid.v4();
      db.CourseSequencedGeometry.destroy.mockResolvedValueOnce(1);

      const result = await clearSequenced(courseId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.CourseSequencedGeometry.destroy).toHaveBeenCalledWith({
        where: {
          courseId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('clearUnsequenced', () => {
    it('should call destroy on CourseUnsequencedUntimedGeometry', async () => {
      const courseId = uuid.v4();
      db.CourseUnsequencedUntimedGeometry.destroy.mockResolvedValueOnce(1);

      const result = await clearUnsequenced(courseId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.CourseUnsequencedUntimedGeometry.destroy).toHaveBeenCalledWith({
        where: {
          courseId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('clearTimed', () => {
    it('should call destroy on CourseUnsequencedTimedGeometry', async () => {
      const courseId = uuid.v4();
      db.CourseUnsequencedTimedGeometry.destroy.mockResolvedValueOnce(1);

      const result = await clearTimed(courseId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.CourseUnsequencedTimedGeometry.destroy).toHaveBeenCalledWith({
        where: {
          courseId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('upsertCourse', () => {
    const mockCourse = {
      id: uuid.v4(),
      name: `Course ${faker.random.word()}`,
      calendarEventId: uuid.v4(),
    };
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
    it('should call upsert on Course table and generate random uuid when not provided', async () => {
      const result = await upsertCourse(
        null,
        { ...mockCourse, id: undefined },
        mockTransaction,
      );

      expect(result).toEqual({
        ...mockCourse,
        id: expect.any(String),
      });
      expect(db.Course.upsert).toHaveBeenCalledWith(
        {
          ...mockCourse,
          id: expect.any(String),
        },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on Course table and use the provided uuid', async () => {
      const result = await upsertCourse(mockCourse.id, mockCourse);

      expect(result).toEqual(mockCourse);
      expect(db.Course.upsert).toHaveBeenCalledWith(mockCourse, {
        transaction: undefined,
      });
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const courseId = uuid.v4();

      const result = await upsertCourse(courseId);

      expect(result).toEqual({ id: courseId });
      expect(db.Course.upsert).toHaveBeenCalledWith(
        { id: courseId },
        { transaction: undefined },
      );
    });
  });

  describe('getSequencedByCourseId', () => {
    it('should findAll CourseSequencedGeometry', async () => {
      const courseId = uuid.v4();
      const mockGeometries = [
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
        {
          id: uuid.v4(),
          geometryType: geometryType.POINT,
          order: 1,
          coordinates: [
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
          ],
        },
      ];
      db.CourseSequencedGeometry.findAll.mockResolvedValueOnce(
        mockGeometries.map((row) => {
          return { toJSON: () => row };
        }),
      );
      const result = await getSequencedByCourseId(courseId);

      expect(db.CourseSequencedGeometry.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            courseId,
          },
          order: [['order', 'ASC']],
          include: defaultIncludeExpectation,
        }),
      );
      expect(result).toEqual([
        {
          ...mockGeometries[0],
          points: mockGeometries[0].points.map((row) => {
            return { ...row, position: row.position.coordinates };
          }),
        },
        {
          ...mockGeometries[1],
          points: mockGeometries[1].points.map((row) => {
            return { ...row, position: row.position.coordinates };
          }),
          coordinates: [mockGeometries[1].coordinates],
        },
      ]);
    });
  });

  describe('getUnsequencedByCourseId', () => {
    it('should findAll CourseUnsequencedUntimedGeometry', async () => {
      const courseId = uuid.v4();
      const mockGeometries = [
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
      db.CourseUnsequencedUntimedGeometry.findAll.mockResolvedValueOnce(
        mockGeometries.map((row) => {
          return { toJSON: () => row };
        }),
      );
      const result = await getUnsequencedByCourseId(courseId);

      expect(db.CourseUnsequencedUntimedGeometry.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            courseId,
          },
          include: defaultIncludeExpectation,
        }),
      );
      expect(result).toEqual([
        {
          ...mockGeometries[0],
          points: mockGeometries[0].points.map((row) => {
            return { ...row, position: row.position.coordinates };
          }),
          coordinates: mockGeometries[0].coordinates[0],
        },
      ]);
    });
  });

  describe('getTimedByCourseId', () => {
    it('should findAll CourseUnsequencedTimedGeometry', async () => {
      const courseId = uuid.v4();
      const mockGeometries = [
        {
          id: uuid.v4(),
          geometryType: geometryType.POINT,
          order: 1,
          coordinates: [
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
          ],
        },
      ];
      db.CourseUnsequencedTimedGeometry.findAll.mockResolvedValueOnce(
        mockGeometries.map((row) => {
          return { toJSON: () => row };
        }),
      );
      const result = await getTimedByCourseId(courseId);

      expect(db.CourseUnsequencedTimedGeometry.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            courseId,
          },
          include: defaultIncludeExpectation,
        }),
      );
      expect(result).toEqual([
        {
          ...mockGeometries[0],
          points: mockGeometries[0].points.map((row) => {
            return { ...row, position: row.position.coordinates };
          }),
          coordinates: [mockGeometries[0].coordinates],
        },
      ]);
    });
  });

  describe('getSequencedByCompetitionId', () => {
    it('should findAll to CourseSequencedGeometry using competition id', async () => {
      const competitionUnitId = uuid.v4();
      const mockGeometries = [
        {
          id: uuid.v4(),
          geometryType: geometryType.POINT,
          order: 1,
          coordinates: [
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
          ],
        },
      ];
      db.CourseSequencedGeometry.findAll.mockResolvedValueOnce(
        mockGeometries.map((row) => {
          return { toJSON: () => row };
        }),
      );
      await getSequencedByCompetitionId(competitionUnitId);

      expect(db.CourseSequencedGeometry.findAll).toHaveBeenCalledWith({
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'course',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'competitionUnit',
                where: {
                  id: competitionUnitId,
                },
              }),
            ]),
          }),
        ]),
        undefined,
      });
    });
  });

  describe('getUnsequencedByCompetitionId', () => {
    it('should findAll to CourseUnsequencedUntimedGeometry using competition id', async () => {
      const competitionUnitId = uuid.v4();
      const mockGeometries = [
        {
          id: uuid.v4(),
          geometryType: geometryType.POINT,
          order: 1,
          coordinates: [
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
          ],
        },
      ];
      db.CourseUnsequencedUntimedGeometry.findAll.mockResolvedValueOnce(
        mockGeometries.map((row) => {
          return { toJSON: () => row };
        }),
      );
      await getUnsequencedByCompetitionId(competitionUnitId);

      expect(db.CourseUnsequencedUntimedGeometry.findAll).toHaveBeenCalledWith({
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'course',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'competitionUnit',
                where: {
                  id: competitionUnitId,
                },
              }),
            ]),
          }),
        ]),
        undefined,
      });
    });
  });

  describe('getTimedByCompetitionId', () => {
    it('should findAll to CourseUnsequencedTimedGeometry using competition id', async () => {
      const competitionUnitId = uuid.v4();
      const mockGeometries = [
        {
          id: uuid.v4(),
          geometryType: geometryType.POINT,
          order: 1,
          coordinates: [
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
          ],
        },
      ];
      db.CourseUnsequencedTimedGeometry.findAll.mockResolvedValueOnce(
        mockGeometries.map((row) => {
          return { toJSON: () => row };
        }),
      );
      await getTimedByCompetitionId(competitionUnitId);

      expect(db.CourseUnsequencedTimedGeometry.findAll).toHaveBeenCalledWith({
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'course',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'competitionUnit',
                where: {
                  id: competitionUnitId,
                },
              }),
            ]),
          }),
        ]),
        undefined,
      });
    });
  });

  describe('clearPoints', () => {
    it('should work provided array of id', async () => {
      const ids = Array(3)
        .fill()
        .map(() => uuid.v4());
      await clearPoints(ids, mockTransaction);

      expect(db.CoursePoint.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: ids,
          },
        },
        transaction: mockTransaction,
      });
    });
    it('should work when provided with single id', async () => {
      const id = uuid.v4();
      await clearPoints(id, mockTransaction);

      expect(db.CoursePoint.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: [id],
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('bulkInsertPoints', () => {
    it('should bulkCreate when provided with non-mepty array', async () => {
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
      await bulkInsertPoints(points);

      expect(db.CoursePoint.bulkCreate).toHaveBeenCalledWith(points);
    });

    it('should skip bulkCreate when provided with empty array/nothing', async () => {
      await bulkInsertPoints();

      expect(db.CoursePoint.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
