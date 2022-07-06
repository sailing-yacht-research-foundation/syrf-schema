const createMockSequelizeModel = () => {
  return {
    upsert: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAllWithPaging: jest.fn(),
    findAndCountAll: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
  };
};

jest.mock('./index', () => {
  return {
    sequelize: {
      transaction: jest.fn(() => {
        return {
          commit: jest.fn(),
          rollback: jest.fn(),
        };
      }),
    },
    Sequelize: jest.requireActual('sequelize').Sequelize,
    Op: jest.requireActual('sequelize').Op,
    // Below should be each models mock, simpler to do it this way then to re-create mocked models with sequelize mock
    CalendarEvent: createMockSequelizeModel(),
    CompetitionUnit: createMockSequelizeModel(),
    Course: createMockSequelizeModel(),
    CoursePoint: createMockSequelizeModel(),
    CourseSequencedGeometry: createMockSequelizeModel(),
    CourseUnsequencedTimedGeometry: createMockSequelizeModel(),
    CourseUnsequencedUntimedGeometry: createMockSequelizeModel(),
    MarkTracker: createMockSequelizeModel(),
    Participant: createMockSequelizeModel(),
    ScrapedFailedUrl: createMockSequelizeModel(),
    ScrapedSuccessfulUrl: createMockSequelizeModel(),
    SlicedWeather: createMockSequelizeModel(),
    SubscriptionTier: createMockSequelizeModel(),
    TrackHistory: createMockSequelizeModel(),
    UserFollower: createMockSequelizeModel(),
    UserNotification: createMockSequelizeModel(),
    UserProfile: createMockSequelizeModel(),
    UserSetting: createMockSequelizeModel(),
    UserShareableInfo: createMockSequelizeModel(),
    UserStream: createMockSequelizeModel(),
    Vessel: createMockSequelizeModel(),
    VesselEditor: createMockSequelizeModel(),
    VesselGroupEditor: createMockSequelizeModel(),
    VesselLifeRaft: createMockSequelizeModel(),
    VesselParticipant: createMockSequelizeModel(),
    VesselParticipantCrew: createMockSequelizeModel(),
    VesselParticipantCrewTrackJson: createMockSequelizeModel(),
    VesselParticipantEvent: createMockSequelizeModel(),
    VesselParticipantGroup: createMockSequelizeModel(),
    VesselParticipantTrackMetadata: createMockSequelizeModel(),
    VesselParticipantTrackJson: createMockSequelizeModel(),
  };
});
