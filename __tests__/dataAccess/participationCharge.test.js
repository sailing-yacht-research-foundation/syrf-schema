const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  getById,
  getBySessionId,
  getByEventAndUser,
  getEventChargedCount,
  insert,
  update,
} = require('../../dataAccess/v1/participationCharge');

const db = require('../../index');

describe('Participation Charge DAL', () => {
  const mockParticipationCharge = {
    id: uuid.v4(),
    userId: uuid.v4(),
    calendarEventId: uuid.v4(),
    checkoutSessionId: `sess_${faker.random.alphaNumeric(14)}`,
    expireDate: new Date(),
    paymentDate: null,
  };
  beforeAll(() => {
    db.ParticipationCharge.findByPk.mockResolvedValue({
      toJSON: () => mockParticipationCharge,
    });
    db.ParticipationCharge.findOne.mockResolvedValue(mockParticipationCharge);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getById', () => {
    it('should findByPk on ParticipationCharge table, and return the value', async () => {
      const result = await getById(mockParticipationCharge.id);

      expect(result).toEqual(mockParticipationCharge);
      expect(db.ParticipationCharge.findByPk).toHaveBeenCalledWith(
        mockParticipationCharge.id,
      );
    });
  });

  describe('getBySessionId', () => {
    it('should findOne on ParticipationCharge table, and return the value', async () => {
      const result = await getBySessionId(
        mockParticipationCharge.checkoutSessionId,
      );

      expect(result).toEqual(mockParticipationCharge);
      expect(db.ParticipationCharge.findOne).toHaveBeenCalledWith({
        where: { checkoutSessionId: mockParticipationCharge.checkoutSessionId },
        raw: true,
      });
    });
  });

  describe('getByEventAndUser', () => {
    it('should findOne on ParticipationCharge table using calendar event and user id', async () => {
      const result = await getByEventAndUser(
        mockParticipationCharge.calendarEventId,
        mockParticipationCharge.userId,
      );

      expect(result).toEqual(mockParticipationCharge);
      expect(db.ParticipationCharge.findOne).toHaveBeenCalledWith({
        where: {
          calendarEventId: mockParticipationCharge.calendarEventId,
          userId: mockParticipationCharge.userId,
        },
        raw: true,
      });
    });
  });

  describe('getEventChargedCount', () => {
    it('should return number of participant already charged and paid', async () => {
      db.ParticipationCharge.count.mockResolvedValueOnce(0);
      const result = await getEventChargedCount(
        mockParticipationCharge.calendarEventId,
      );

      expect(result).toEqual(0);
      expect(db.ParticipationCharge.count).toHaveBeenCalledWith({
        where: {
          calendarEventId: mockParticipationCharge.calendarEventId,
          paymentDate: { [db.Op.ne]: null },
        },
      });
    });
  });

  describe('insert', () => {
    it('should create ParticipationCharge', async () => {
      const mockTransaction = db.sequelize.transaction();
      db.ParticipationCharge.create.mockResolvedValueOnce(
        mockParticipationCharge,
      );

      const result = await insert(mockParticipationCharge, mockTransaction);

      expect(result).toEqual(mockParticipationCharge);
      expect(db.ParticipationCharge.create).toHaveBeenCalledWith(
        {
          calendarEventId: mockParticipationCharge.calendarEventId,
          userId: mockParticipationCharge.userId,
          checkoutSessionId: mockParticipationCharge.checkoutSessionId,
          expireDate: mockParticipationCharge.expireDate,
        },
        { transaction: mockTransaction },
      );
    });
  });

  describe('update', () => {
    it('should update ParticipationCharge', async () => {
      const mockTransaction = db.sequelize.transaction();
      db.ParticipationCharge.update.mockResolvedValueOnce([1, undefined]);

      const updateParams = {
        checkoutSessionId: `sess_${faker.random.alphaNumeric(14)}`,
        expireDate: new Date(),
      };
      const result = await update(
        mockParticipationCharge.id,
        updateParams,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.ParticipationCharge.update).toHaveBeenCalledWith(updateParams, {
        where: { id: mockParticipationCharge.id },
        transaction: mockTransaction,
      });
    });

    it('should update only paymentDate when provided with', async () => {
      const mockTransaction = db.sequelize.transaction();
      db.ParticipationCharge.update.mockResolvedValueOnce([1, undefined]);

      const updateParams = {
        paymentDate: new Date(),
      };
      const result = await update(
        mockParticipationCharge.id,
        updateParams,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.ParticipationCharge.update).toHaveBeenCalledWith(updateParams, {
        where: { id: mockParticipationCharge.id },
        transaction: mockTransaction,
      });
    });
  });
});
