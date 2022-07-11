const uuid = require('uuid');

const {
  insert,
  getByParticipant,
  getByDocument,
  deleteByDocument,
  deleteByParticipant,
} = require('../../dataAccess/v1/participantDocumentAgreement');

const db = require('../../index');

describe('Participant Document Agreement DAL', () => {
  const mockDocumentAgreement = {
    participantId: uuid.v4(),
    documentId: uuid.v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('insert', () => {
    it('should create on ParticipantDocumentAgreement table, and return the value', async () => {
      db.ParticipantDocumentAgreement.create.mockResolvedValueOnce(
        mockDocumentAgreement,
      );
      const result = await insert(mockDocumentAgreement, mockTransaction);

      expect(result).toEqual(mockDocumentAgreement);
      expect(db.ParticipantDocumentAgreement.create).toHaveBeenCalledWith(
        {
          participantId: mockDocumentAgreement.participantId,
          documentId: mockDocumentAgreement.documentId,
        },
        { transaction: mockTransaction },
      );
    });
  });

  describe('getByParticipant', () => {
    it('should findAll Document Agreements of a participant', async () => {
      db.ParticipantDocumentAgreement.findAll.mockResolvedValueOnce([
        mockDocumentAgreement,
      ]);

      const result = await getByParticipant(
        mockDocumentAgreement.participantId,
      );

      expect(result).toEqual([mockDocumentAgreement]);
      expect(db.ParticipantDocumentAgreement.findAll).toHaveBeenCalledWith({
        where: {
          participantId: mockDocumentAgreement.participantId,
        },
      });
    });
  });

  describe('getByDocument', () => {
    it('should findAll Document Agreements of a document', async () => {
      db.ParticipantDocumentAgreement.findAll.mockResolvedValueOnce([
        mockDocumentAgreement,
      ]);

      const result = await getByDocument(mockDocumentAgreement.documentId);

      expect(result).toEqual([mockDocumentAgreement]);
      expect(db.ParticipantDocumentAgreement.findAll).toHaveBeenCalledWith({
        where: {
          documentId: mockDocumentAgreement.documentId,
        },
      });
    });
  });

  describe('deleteByDocument', () => {
    it('should destroy record from ParticipantDocumentAgreement based on participant', async () => {
      const documentId = uuid.v4();
      db.ParticipantDocumentAgreement.destroy.mockResolvedValueOnce(1);

      const result = await deleteByDocument(documentId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.ParticipantDocumentAgreement.destroy).toHaveBeenCalledWith({
        where: {
          documentId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('deleteByParticipant', () => {
    it('should destroy record from ParticipantDocumentAgreement based on participant', async () => {
      const participantId = uuid.v4();
      db.ParticipantDocumentAgreement.destroy.mockResolvedValueOnce(1);

      const result = await deleteByParticipant(participantId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.ParticipantDocumentAgreement.destroy).toHaveBeenCalledWith({
        where: {
          participantId,
        },
        transaction: mockTransaction,
      });
    });
  });
});
