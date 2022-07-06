const { faker } = require('@faker-js/faker');

const {
  getAll,
  getByCode,
  getByStripeId,
} = require('../../dataAccess/v1/subscriptionTier');

const db = require('../../index');

describe('Subscription Tier DAL', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getAll', () => {
    it('should call findAll on SubscriptionTier table', async () => {
      await getAll();
      expect(db.SubscriptionTier.findAll).toHaveBeenCalledWith({ raw: true });
    });
  });

  describe('getByCode', () => {
    it('should call findOne on SubscriptionTier table  with tierCode in where condition', async () => {
      const tierCode = 'BASIC';
      await getByCode(tierCode);

      expect(db.SubscriptionTier.findOne).toHaveBeenCalledWith({
        where: { tierCode },
        raw: true,
      });
    });
  });

  describe('getByStripeId', () => {
    it('should call findOne on SubscriptionTier table with stripeProductId in where condition', async () => {
      const stripeProductId = `prod_${faker.random.alphaNumeric(14)}`;
      await getByStripeId(stripeProductId);

      expect(db.SubscriptionTier.findOne).toHaveBeenCalledWith({
        where: { stripeProductId },
        raw: true,
      });
    });
  });
});
