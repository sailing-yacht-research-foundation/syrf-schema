const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  getCurrent,
  getUnstoppedCU,
  getUsersPrivateTracks,
} = require('../../dataAccess/v1/trackNow');

const db = require('../../index');

describe('Track Now DAL', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getCurrent', () => {
    it('should call findAll on CompetitionUnit table', async () => {
      const userId = uuid.v4();
      const mockEvent = {
        id: uuid.v4(),
        name: `Event ${faker.random.word()}`,
        isPrivate: true,
      };
      const mockCompetition = {
        id: uuid.v4(),
        name: `Race ${faker.random.numeric(2)}`,
        description: faker.random.words(10),
        isCompleted: false,
        endTime: null,
        createdById: userId,
      };
      db.CompetitionUnit.findAll.mockResolvedValueOnce([
        {
          toJSON: () => {
            return { ...mockCompetition, calendarEvent: mockEvent };
          },
        },
      ]);
      const mockParticipant = {
        id: uuid.v4(),
        name: faker.name.findName(),
      };
      const mockVesselParticipant = {
        id: uuid.v4(),
        isCommittee: false,
      };
      const mockVessel = {
        id: uuid.v4(),
        lengthInMeters: faker.datatype.float(),
        publicName: `Vessel of ${faker.name.findName()}`,
      };
      db.Participant.findOne.mockResolvedValueOnce({
        toJSON: () => {
          return {
            ...mockParticipant,
            vesselParticipants: [
              { ...mockVesselParticipant, vessel: mockVessel },
            ],
          };
        },
      });

      const result = await getCurrent(userId);

      expect(result).toEqual({
        competitionUnit: { ...mockCompetition, calendarEvent: null },
        calendarEvent: mockEvent,
        participant: { ...mockParticipant, vesselParticipants: null },
        vesselParticipant: { ...mockVesselParticipant, vessel: mockVessel },
        vessel: mockVessel,
      });
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith({
        where: {
          createdById: userId,
          isCompleted: false,
          endTime: {
            [db.Op.eq]: null,
          },
        },
        include: [
          expect.objectContaining({
            as: 'calendarEvent',
            required: true,
            where: {
              isPrivate: true,
            },
          }),
        ],
        limit: 1,
        order: [['createdAt', 'DESC']],
      });
      expect(db.Participant.findOne).toHaveBeenCalledWith({
        where: {
          userProfileId: userId,
          calendarEventId: mockEvent.id,
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'vesselParticipants',
            include: expect.arrayContaining([
              expect.objectContaining({
                as: 'vessel',
              }),
            ]),
          }),
        ]),
      });
    });
    it('should return null when no competition found', async () => {
      db.CompetitionUnit.findAll.mockResolvedValueOnce([]);
      const result = await getCurrent(uuid.v4());

      expect(result).toEqual(null);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledTimes(1);
      expect(db.Participant.findOne).not.toHaveBeenCalled();
    });
    it('should return null when no participant found', async () => {
      const userId = uuid.v4();
      const mockEvent = {
        id: uuid.v4(),
        name: `Event ${faker.random.word()}`,
        isPrivate: true,
      };
      const mockCompetition = {
        id: uuid.v4(),
        name: `Race ${faker.random.numeric(2)}`,
        description: faker.random.words(10),
        isCompleted: false,
        endTime: null,
        createdById: userId,
      };
      db.CompetitionUnit.findAll.mockResolvedValueOnce([
        {
          toJSON: () => {
            return { ...mockCompetition, calendarEvent: mockEvent };
          },
        },
      ]);
      db.Participant.findOne.mockResolvedValueOnce(undefined);
      const result = await getCurrent(userId);

      expect(result).toEqual(null);
      expect(db.CompetitionUnit.findAll).toHaveBeenCalledTimes(1);
      expect(db.Participant.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUnstoppedCU', () => {
    it('should call findAll on CompetitionUnit table that is created by the user, not completed, and null endTime', async () => {
      const userId = uuid.v4();

      await getUnstoppedCU(userId);

      expect(db.CompetitionUnit.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.arrayContaining(['id']),
          where: {
            createdById: userId,
            isCompleted: false,
            endTime: {
              [db.Op.eq]: null,
            },
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'calendarEvent',
              attributes: [],
              required: true,
              where: {
                isPrivate: true,
              },
            }),
          ]),
          order: [['createdAt', 'DESC']],
        }),
      );
    });
  });

  describe('getUsersPrivateTracks', () => {
    it('should call findAll on CalendarEvent table', async () => {
      const userId = uuid.v4();

      await getUsersPrivateTracks(userId);

      expect(db.CalendarEvent.findAll).toHaveBeenCalledWith({
        where: {
          createdById: userId,
          isPrivate: true,
        },
        undefined,
      });
    });
  });
});
