const uuid = require('uuid');

const {
  insert,
  getByParticipant,
  deleteByParticipantAndType,
  deleteByParticipant,
} = require('../../dataAccess/v1/participantWaiverAgreement');

const db = require('../../index');
const { waiverTypes } = require('../../enums');

describe('Participant Waiver Agreement DAL', () => {
  const mockWaiverAgreement = {
    id: uuid.v4(),
    participantId: uuid.v4(),
    waiverType: waiverTypes.mediaWaiver,
    agreedAt: new Date(),
  };
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('insert', () => {
    it('should create on ParticipantWaiverAgreement table, and return the value', async () => {
      db.ParticipantWaiverAgreement.create.mockResolvedValueOnce(
        mockWaiverAgreement,
      );
      const result = await insert(mockWaiverAgreement, mockTransaction);

      expect(result).toEqual(mockWaiverAgreement);
      expect(db.ParticipantWaiverAgreement.create).toHaveBeenCalledWith(
        {
          participantId: mockWaiverAgreement.participantId,
          waiverType: mockWaiverAgreement.waiverType,
          agreedAt: mockWaiverAgreement.agreedAt,
        },
        { transaction: mockTransaction },
      );
    });
  });

  describe('getByParticipant', () => {
    it('should findAll Waiver Agreements of a participant', async () => {
      db.ParticipantWaiverAgreement.findAll.mockResolvedValueOnce([
        mockWaiverAgreement,
      ]);

      const result = await getByParticipant(mockWaiverAgreement.participantId);

      expect(result).toEqual([mockWaiverAgreement]);
      expect(db.ParticipantWaiverAgreement.findAll).toHaveBeenCalledWith({
        where: {
          participantId: mockWaiverAgreement.participantId,
        },
      });
    });
  });

  describe('deleteByParticipantAndType', () => {
    it('should destroy record from ParticipantWaiverAgreement based on participant and waiver types', async () => {
      const participantIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      const waiverTypeList = [waiverTypes.mediaWaiver];
      db.ParticipantWaiverAgreement.destroy.mockResolvedValueOnce(3);

      const result = await deleteByParticipantAndType(
        {
          participantIds,
          waiverTypes: waiverTypeList,
        },
        mockTransaction,
      );

      expect(result).toEqual(3);
      expect(db.ParticipantWaiverAgreement.destroy).toHaveBeenCalledWith({
        where: {
          participantId: {
            [db.Op.in]: participantIds,
          },
          waiverType: {
            [db.Op.in]: waiverTypeList,
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('deleteByParticipant', () => {
    it('should destroy record from ParticipantWaiverAgreement based on participant', async () => {
      const participantId = uuid.v4();
      db.ParticipantWaiverAgreement.destroy.mockResolvedValueOnce(1);

      const result = await deleteByParticipant(participantId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.ParticipantWaiverAgreement.destroy).toHaveBeenCalledWith({
        where: {
          participantId,
        },
        transaction: mockTransaction,
      });
    });
  });
});
