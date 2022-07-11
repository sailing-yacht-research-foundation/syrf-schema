const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  pushTrackerPoints,
  getAllPoints,
  removeTrackerPoints,
  removeTrackerPointsByCompetitionUnits,
  getById,
  validateStreamer,
  getPointsByCourseId,
} = require('../../dataAccess/v1/markStream');

const db = require('../../index');

describe('Mark Stream DAL', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('pushTrackerPoints', () => {
    it('should add point data to the array of active point tracker', async () => {
      const initialLength = (await getAllPoints()).length;
      const competitionUnitId = uuid.v4();
      const point = {
        id: uuid.v4(),
        markTrackerId: uuid.v4(),
      };
      await pushTrackerPoints(point, competitionUnitId);

      const afterLength = (await getAllPoints()).length;
      expect(afterLength).toEqual(initialLength + 1);
    });

    it('should replace point if exist in the array', async () => {
      const initialLength = (await getAllPoints()).length;
      const competitionUnitId = uuid.v4();
      const initialPoint = {
        id: uuid.v4(),
        markTrackerId: uuid.v4(),
        remark: 1,
      };
      await pushTrackerPoints(initialPoint, competitionUnitId);
      const lengthAfterInit = (await getAllPoints()).length;
      await pushTrackerPoints(
        { ...initialPoint, remark: 2 },
        competitionUnitId,
      );
      const finalLength = (await getAllPoints()).length;

      expect(initialLength).not.toEqual(lengthAfterInit);
      expect(finalLength).toEqual(lengthAfterInit);
    });
  });

  describe('removeTrackerPoints', () => {
    it('should remove tracker points of a competition from array', async () => {
      const competitionUnitId = uuid.v4();
      const point = {
        id: uuid.v4(),
        markTrackerId: uuid.v4(),
      };
      await pushTrackerPoints(point, competitionUnitId);
      const arrayLength = (await getAllPoints()).length;
      expect(arrayLength).toBeGreaterThan(0);

      await removeTrackerPoints(competitionUnitId);
      const finalLength = (await getAllPoints()).length;
      expect(finalLength).toEqual(arrayLength - 1);
    });
  });

  describe('removeTrackerPointsByCompetitionUnits', () => {
    it('should remove tracker points of a competition from array', async () => {
      const testSize = 5;
      const competitionUnitIds = Array(testSize)
        .fill()
        .map(() => uuid.v4());
      for (let i = 0; i < competitionUnitIds.length; i++) {
        const id = competitionUnitIds[i];
        await pushTrackerPoints(
          {
            id: uuid.v4(),
            markTrackerId: uuid.v4(),
          },
          id,
        );
      }
      const arrayLength = (await getAllPoints()).length;
      expect(arrayLength).toBeGreaterThan(0);

      await removeTrackerPointsByCompetitionUnits(competitionUnitIds);
      const finalLength = (await getAllPoints()).length;
      expect(finalLength).toEqual(arrayLength - testSize);
    });

    it('should not remove anything if provided with no params', async () => {
      const competitionUnitIds = Array(5)
        .fill()
        .map(() => uuid.v4());
      for (let i = 0; i < competitionUnitIds.length; i++) {
        const id = competitionUnitIds[i];
        await pushTrackerPoints(
          {
            id: uuid.v4(),
            markTrackerId: uuid.v4(),
          },
          id,
        );
      }
      const arrayLength = (await getAllPoints()).length;
      expect(arrayLength).toBeGreaterThan(0);

      await removeTrackerPointsByCompetitionUnits();
      const finalLength = (await getAllPoints()).length;
      expect(finalLength).toEqual(arrayLength);
    });
  });

  describe('getById', () => {
    it('should return points based on the mark tracker id', async () => {
      const competitionUnitId = uuid.v4();
      const markTrackerId = uuid.v4();
      const point = {
        id: uuid.v4(),
        markTrackerId,
      };
      await pushTrackerPoints(point, competitionUnitId);

      const markTracker = await getById(markTrackerId);
      expect(markTracker).toEqual([{ ...point, competitionUnitId }]);
    });
  });

  describe('validateStreamer', () => {
    it('should findOne on MarkTracker and return the values', async () => {
      const userProfileId = uuid.v4();
      const markTrackerId = uuid.v4();
      const markTracker = {
        id: markTrackerId,
        name: `Mark #${faker.random.numeric(2)}`,
        trackerUrl: faker.internet.url(),
        calendarEventId: uuid.v4(),
        userProfileId,
      };
      db.MarkTracker.findOne.mockResolvedValueOnce({
        toJSON: () => markTracker,
      });

      const result = await validateStreamer(userProfileId, markTrackerId);

      expect(result).toEqual(markTracker);
      expect(db.MarkTracker.findOne).toHaveBeenCalledWith({
        where: {
          userProfileId,
          id: markTrackerId,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'points',
          }),
        ]),
      });
    });
  });

  describe('getPointsByCourseId', () => {
    it('should findAll on all course geometry tables, and return an array of points', async () => {
      const courseId = uuid.v4();
      const sequencedGeometries = [
        {
          id: uuid.v4(),
          points: [
            {
              id: uuid.v4(),
              properties: {},
              markTrackerId: uuid.v4(),
            },
          ],
        },
      ];
      db.CourseSequencedGeometry.findAll.mockResolvedValueOnce(
        sequencedGeometries,
      );
      const unsequencedUntimedGeometries = [
        {
          id: uuid.v4(),
          points: [
            {
              id: uuid.v4(),
              properties: {},
              markTrackerId: uuid.v4(),
            },
          ],
        },
      ];
      db.CourseUnsequencedUntimedGeometry.findAll.mockResolvedValueOnce(
        unsequencedUntimedGeometries,
      );
      const unsequencedTimedGeometries = [
        {
          id: uuid.v4(),
          points: [
            {
              id: uuid.v4(),
              properties: {},
              markTrackerId: uuid.v4(),
            },
          ],
        },
      ];
      db.CourseUnsequencedTimedGeometry.findAll.mockResolvedValueOnce(
        unsequencedTimedGeometries,
      );

      const result = await getPointsByCourseId(courseId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toEqual(3);
      [
        db.CourseSequencedGeometry.findAll,
        db.CourseUnsequencedUntimedGeometry.findAll,
        db.CourseUnsequencedTimedGeometry.findAll,
      ].forEach((dbFunc) => {
        expect(dbFunc).toHaveBeenCalledWith({
          where: {
            courseId,
          },
          raw: true,
          nest: true,
          attributes: expect.arrayContaining(['id']),
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'points',
              attributes: expect.arrayContaining([
                'id',
                'properties',
                'markTrackerId',
              ]),
            }),
          ]),
        });
      });
    });
  });
});
