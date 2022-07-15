const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  create,
  addRecipients,
  getAllMessageByEvent,
} = require('../../dataAccess/v1/calendarEventMessage');

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
    it('should call create on CalendarEventMessage', async () => {
      const data = {
        id: uuid.v4(),
        calendarEventId: uuid.v4(),
        senderId: uuid.v4(),
        messageContent: faker.lorem.paragraph(4),
        sentAt: new Date(),
      };
      await create(data, mockTransaction);

      expect(db.CalendarEventMessage.create).toHaveBeenCalledWith(data, {
        validate: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('addRecipients', () => {
    it('should bulkCreate on CalendarEventMessageRecipient', async () => {
      const messageId = uuid.v4();
      const data = Array(3)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            messageId,
            recipientId: uuid.v4(),
          };
        });

      await addRecipients(data, mockTransaction);

      expect(db.CalendarEventMessageRecipient.bulkCreate).toHaveBeenCalledWith(
        data,
        {
          validate: true,
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('getAllMessageByEvent', () => {
    it('should findAll CalendarEventMessage of an event', async () => {
      const calendarEventId = uuid.v4();
      const mockMessages = Array(10)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            senderId: uuid.v4(),
            messageContent: faker.lorem.paragraph(4),
            sentAt: new Date(),
            recipients: [],
            sender: {
              name: faker.name.findName(),
              avatar: faker.random.numeric(2),
            },
          };
        });
      db.CalendarEventMessage.findAll.mockResolvedValueOnce(
        mockMessages.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getAllMessageByEvent(calendarEventId);
      expect(result).toEqual(mockMessages);
      expect(db.CalendarEventMessage.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'recipients',
              required: false,
              include: expect.arrayContaining([
                expect.objectContaining({
                  as: 'recipient',
                }),
              ]),
            }),
            expect.objectContaining({
              as: 'sender',
              required: true,
            }),
          ]),
          where: {
            calendarEventId,
          },
          order: [['sentAt', 'DESC']],
        }),
      );
    });
  });
});
