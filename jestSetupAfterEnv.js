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
    VesselParticipantTrackMetadata: {
      count: jest.fn(),
    },
  };
});
