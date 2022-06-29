const createMockSequelizeModel = () => {
  return {
    upsert: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAllWithPaging: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
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
    Op: jest.requireActual('sequelize').Op,
    // Below should be each models mock, simpler to do it this way then to re-create mocked models with sequelize mock
    CompetitionUnit: createMockSequelizeModel(),
    Participant: createMockSequelizeModel(),
    Vessel: createMockSequelizeModel(),
    VesselParticipantCrew: createMockSequelizeModel(),
    VesselParticipantEvent: createMockSequelizeModel(),
    VesselParticipantGroup: createMockSequelizeModel(),
    VesselParticipantTrackMetadata: createMockSequelizeModel(),
    VesselParticipantTrackJson: createMockSequelizeModel(),
  };
});
