const uuid = require('uuid');

const {
  getCountByCompetition,
} = require('../../dataAccess/v1/vesselParticipantTrackMetadata');

const db = require('../../index');

describe('getCountByCompetition', () => {
  it('should call count on VesselParticipantTrackMetadata table and return the value', async () => {
    db.VesselParticipantTrackMetadata.count.mockResolvedValueOnce(1);
    const competitionUnitId = uuid.v4();

    const result = await getCountByCompetition(competitionUnitId);

    expect(result).toEqual(1);
    expect(db.VesselParticipantTrackMetadata.count).toHaveBeenCalledWith({
      where: { competitionUnitId },
    });
  });
});
