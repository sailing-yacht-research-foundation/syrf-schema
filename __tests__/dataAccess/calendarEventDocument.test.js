const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  create,
  getAllDocumentByEvent,
  delete: deleteDoc,
  deleteAllDoc,
  getByDocumentIsSigned,
} = require('../../dataAccess/v1/calendarEventDocument');

const db = require('../../index');

describe('Calendar Event Message DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should call create on CalendarEventDocument', async () => {
      const data = {
        id: uuid.v4(),
        calendarEventId: uuid.v4(),
        documentName: faker.random.words(),
        isRequired: true,
        documentUrl: `${faker.internet.url()}/file.pdf`,
        uploaderId: uuid.v4(),
      };
      await create(data, mockTransaction);

      expect(db.CalendarEventDocument.create).toHaveBeenCalledWith(data, {
        validate: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('getAllDocumentByEvent', () => {
    const calendarEventId = uuid.v4();
    const participantId = uuid.v4();
    const mockDocuments = Array(5)
      .fill()
      .map(() => {
        return {
          id: uuid.v4(),
          calendarEventId,
          documentName: faker.random.words(),
          isRequired: true,
          documentUrl: `${faker.internet.url()}/file.pdf`,
          uploaderId: uuid.v4(),
        };
      });
    beforeAll(() => {
      db.CalendarEventDocument.findAllWithPaging.mockResolvedValue({
        count: mockDocuments.length,
        rows: mockDocuments,
        page: 1,
        size: 10,
        sort: 'updatedAt',
        srdir: 'DESC',
        q: '',
        filters: [],
      });
    });

    it('should findAllWithpaging on CalendarEventDocument using event id', async () => {
      const paging = { page: 1, size: 10 };

      const result = await getAllDocumentByEvent({ calendarEventId }, paging);

      expect(result.rows).toEqual(mockDocuments);
      expect(db.CalendarEventDocument.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            calendarEventId,
          },
          include: [
            expect.objectContaining({
              as: 'uploader',
              required: true,
            }),
          ],
        },
        paging,
      );
    });
    it('should findAllWithpaging on CalendarEventDocument using event and participant id ', async () => {
      const paging = { page: 1, size: 10, query: 'test' };

      const result = await getAllDocumentByEvent(
        { calendarEventId, participantId },
        paging,
      );

      expect(result.rows).toEqual(mockDocuments);
      expect(db.CalendarEventDocument.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            calendarEventId,
            documentName: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
          include: [
            expect.objectContaining({
              as: 'uploader',
              required: true,
            }),
            expect.objectContaining({
              as: 'participants',
              through: {
                attributes: ['createdAt'],
              },
              required: false,
              where: {
                id: participantId,
              },
            }),
          ],
        },
        paging,
      );
    });
  });

  describe('delete', () => {
    it('should query the document detail and delete if found', async () => {
      const mockDocument = {
        id: uuid.v4(),
        calendarEventId: uuid.v4(),
        documentName: faker.random.words(),
        isRequired: true,
        documentUrl: `${faker.internet.url()}/file.pdf`,
        uploaderId: uuid.v4(),
      };
      db.CalendarEventDocument.findOne.mockResolvedValueOnce({
        toJSON: () => mockDocument,
      });

      const result = await deleteDoc(
        { id: mockDocument.id, calendarEventId: mockDocument.calendarEventId },
        mockTransaction,
      );

      expect(result).toEqual(mockDocument);
      expect(db.CalendarEventDocument.destroy).toHaveBeenCalledWith({
        where: {
          id: mockDocument.id,
        },
        transaction: mockTransaction,
      });
    });
    it('should not call db destroy if not found', async () => {
      db.CalendarEventDocument.findOne.mockResolvedValueOnce(undefined);

      const result = await deleteDoc(
        { id: uuid.v4(), calendarEventId: uuid.v4() },
        mockTransaction,
      );

      expect(result).toEqual(undefined);
      expect(db.CalendarEventDocument.destroy).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllDoc', () => {
    it('should findAll documents related to an event and delete, also deletes the agreements record if documents exist', async () => {
      const calendarEventId = uuid.v4();
      const mockDocuments = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            documentUrl: `${faker.internet.url()}/file.pdf`,
          };
        });
      db.CalendarEventDocument.findAll.mockResolvedValueOnce(mockDocuments);
      db.CalendarEventDocument.destroy.mockResolvedValueOnce(
        mockDocuments.length,
      );

      const result = await deleteAllDoc(calendarEventId, mockTransaction);

      expect(result).toEqual({
        documentsToDelete: mockDocuments,
        deletedCount: mockDocuments.length,
      });
      expect(db.CalendarEventDocument.destroy).toHaveBeenCalledWith({
        where: {
          calendarEventId,
        },
        transaction: mockTransaction,
      });
      expect(db.ParticipantDocumentAgreement.destroy).toHaveBeenCalledWith({
        where: {
          documentId: {
            [db.Op.in]: mockDocuments.map((row) => row.id),
          },
        },
        transaction: mockTransaction,
      });
    });
    it('should skip delete if no document found', async () => {
      const calendarEventId = uuid.v4();
      db.CalendarEventDocument.findAll.mockResolvedValueOnce([]);

      const result = await deleteAllDoc(calendarEventId, mockTransaction);

      expect(result).toEqual({
        documentsToDelete: [],
        deletedCount: 0,
      });
      expect(db.CalendarEventDocument.destroy).not.toHaveBeenCalled();
      expect(db.ParticipantDocumentAgreement.destroy).not.toHaveBeenCalled();
    });
  });

  describe('getByDocumentIsSigned', () => {
    it('should findOne CalendarEventDocument with an include to participant through Agreement', async () => {
      const mockDocument = {
        id: uuid.v4(),
        documentName: faker.random.words(),
        isRequired: true,
        documentUrl: `${faker.internet.url()}/file.pdf`,
        participants: [
          {
            id: uuid.v4(),
            userProfileId: uuid.v4(),
            ParticipantDocumentAgreement: [{ createdAt: new Date() }],
          },
        ],
      };
      db.CalendarEventDocument.findOne.mockResolvedValueOnce({
        toJSON: () => mockDocument,
      });
      const calendarEventId = uuid.v4();

      const result = await getByDocumentIsSigned(
        mockDocument.id,
        calendarEventId,
        mockDocument.participants[0].id,
      );

      expect(result).toEqual(mockDocument);
      expect(db.CalendarEventDocument.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockDocument.id,
            calendarEventId,
          },
          include: [
            expect.objectContaining({
              as: 'participants',
              through: {
                attributes: ['createdAt'],
              },
              attributes: expect.arrayContaining(['id', 'userProfileId']),
              required: false,
              where: {
                id: mockDocument.participants[0].id,
              },
            }),
          ],
        }),
      );
    });
  });
});
