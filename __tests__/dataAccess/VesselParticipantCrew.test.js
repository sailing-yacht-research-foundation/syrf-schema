const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  bulkCreateWithOptions,
  getCrewsByVesselParticipant,
} = require('../../dataAccess/v1/vesselParticipantCrew');

const db = require('../../index');
const { vesselEvents } = require('../../enums');

describe('Vessel Participant Crew', () => {
  const mockTransaction = db.sequelize.transaction();
  const vesselCrew = {
    id: uuid.v4(),
    vesselParticipantId: uuid.v4(),
    participantId: uuid.v4(),
    startedStream: false,
  };
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('bulkCreateWithOptions', () => {
    it('should call bulkCreate on VesselParticipantCrew table if provided with valid data', async () => {
      const data = [
        {
          ...vesselCrew,
        },
      ];
      db.VesselParticipantCrew.bulkCreate.mockResolvedValueOnce([...data]);
      const options = {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      };

      const result = await bulkCreateWithOptions(data, options);

      expect(result).toEqual(data);
      expect(db.VesselParticipantCrew.bulkCreate).toHaveBeenCalledWith(
        data,
        options,
      );
    });
    it('should not call bulkCreate on VesselParticipantCrew table if provided with empty array', async () => {
      const result = await bulkCreateWithOptions([]);

      expect(result).toEqual([]);
      expect(db.VesselParticipantCrew.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('getCrewsByVesselParticipant', () => {
    it('should pass params to where condition of findAll', async () => {
      const vesselParticipantId = uuid.v4();
      db.VesselParticipantCrew.findAll.mockResolvedValueOnce([
        { toJSON: () => vesselCrew },
      ]);

      const result = await getCrewsByVesselParticipant(vesselParticipantId);

      expect(db.VesselParticipantCrew.findAll).toHaveBeenCalledWith({
        where: { vesselParticipantId },
      });
      expect(result).toEqual([vesselCrew]);
    });
  });
});
