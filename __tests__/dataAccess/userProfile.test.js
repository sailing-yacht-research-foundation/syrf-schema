const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  upsert,
  updateProfile,
  acceptEula,
  getById,
  getBySub,
  getAllByEmail,
  getAllById,
  getAllRegisteredUser,
  delete: deleteUser,
  clear,
  getByStripeSubscription,
  getByStripeCustomer,
  getPushSubscriptions,
  getNearbyUsers,
  claimAnonymousUser,
} = require('../../dataAccess/v1/userProfile');
const { userSignupType } = require('../../enums');

const db = require('../../index');

describe('User Profile DAL', () => {
  const mockUser = {
    id: uuid.v4(),
    sub: uuid.v4(),
    address: faker.address.streetAddress(),
    email_verified: true,
    name: faker.name.findName(),
    email: faker.internet.email(),
    signupType: userSignupType.REGISTERED,
    stripeSubscriptionId: `sub_${faker.random.alphaNumeric(10)}`,
    stripeCustomerId: `cus_${faker.random.alphaNumeric(10)}`,
    // etc, lots of other fields
  };
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('upsert', () => {
    it('should call upsert and return the inserted data', async () => {
      db.UserProfile.upsert.mockResolvedValueOnce([{ toJSON: () => mockUser }]);

      const result = await upsert(mockUser, mockTransaction);

      expect(result).toEqual(mockUser);
      expect(db.UserProfile.upsert).toHaveBeenCalledWith(mockUser, {
        transaction: mockTransaction,
      });
    });
    it('should call upsert even if not provided with data', async () => {
      db.UserProfile.upsert.mockResolvedValueOnce([{ toJSON: () => mockUser }]);

      const result = await upsert(undefined, mockTransaction);

      expect(result).toEqual(mockUser);
      expect(db.UserProfile.upsert).toHaveBeenCalledWith(
        {},
        {
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('updateProfile', () => {
    it('should call update and return', async () => {
      db.UserProfile.update.mockResolvedValueOnce([1, undefined]);

      const result = await updateProfile(
        mockUser.id,
        mockUser,
        mockTransaction,
      );

      expect(result).toEqual([1, undefined]);
      expect(db.UserProfile.update).toHaveBeenCalledWith(mockUser, {
        where: { id: mockUser.id },
        transaction: mockTransaction,
      });
    });

    it('should call update even if not provided with data', async () => {
      db.UserProfile.update.mockResolvedValueOnce([1, undefined]);

      const result = await updateProfile(
        mockUser.id,
        undefined,
        mockTransaction,
      );

      expect(result).toEqual([1, undefined]);
      expect(db.UserProfile.update).toHaveBeenCalledWith(
        {},
        {
          where: { id: mockUser.id },
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('acceptEula', () => {
    it('should call update and return the update count', async () => {
      db.UserProfile.update.mockResolvedValueOnce([1, undefined]);
      const eulaData = {
        acceptEulaVersion: '1.0',
        acceptEulaTimestamp: new Date().toISOString(),
        acceptPrivacyPolicyVersion: '1.0',
        acceptPrivacyPolicyTimestamp: new Date().toISOString(),
      };

      const result = await acceptEula(eulaData, mockUser.id);

      expect(result).toEqual(1);
      expect(db.UserProfile.update).toHaveBeenCalledWith(eulaData, {
        where: { id: mockUser.id, signupType: userSignupType.REGISTERED },
      });
    });
  });

  describe('getById', () => {
    it('should call findByPk on UserProfile table', async () => {
      db.UserProfile.findByPk.mockResolvedValueOnce(mockUser);

      const result = await getById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(db.UserProfile.findByPk).toHaveBeenCalledWith(mockUser.id, {
        raw: true,
      });
    });
  });

  describe('getBySub', () => {
    it('should call findOne on UserProfile table', async () => {
      db.UserProfile.findOne.mockResolvedValueOnce(mockUser);

      const result = await getBySub(mockUser.sub);

      expect(result).toEqual(mockUser);
      expect(db.UserProfile.findOne).toHaveBeenCalledWith(
        { where: { sub: mockUser.sub } },
        {
          raw: true,
        },
      );
    });
  });

  describe('getAllByEmail', () => {
    it('should call findAll on UserProfile table', async () => {
      db.UserProfile.findAll.mockResolvedValueOnce([mockUser]);

      const result = await getAllByEmail([mockUser.email]);

      expect(result).toEqual([mockUser]);
      expect(db.UserProfile.findAll).toHaveBeenCalledWith({
        where: {
          email: {
            [db.Op.in]: [mockUser.email],
          },
        },
        raw: true,
      });
    });
  });

  describe('getAllById', () => {
    it('should call findAll on UserProfile table', async () => {
      db.UserProfile.findAll.mockResolvedValueOnce([mockUser]);

      const attributes = ['id', 'name'];
      const result = await getAllById([mockUser.id], attributes);

      expect(result).toEqual([mockUser]);
      expect(db.UserProfile.findAll).toHaveBeenCalledWith({
        attributes,
        where: {
          id: {
            [db.Op.in]: [mockUser.id],
          },
        },
        raw: true,
      });
    });
  });

  describe('getAllRegisteredUser', () => {
    it('should call findAll on UserProfile table and return all registered user', async () => {
      db.UserProfile.findAll.mockResolvedValueOnce([mockUser]);

      const result = await getAllRegisteredUser();

      expect(result).toEqual([mockUser]);
      expect(db.UserProfile.findAll).toHaveBeenCalledWith({
        where: {
          signupType: userSignupType.REGISTERED,
        },
        attributes: expect.arrayContaining(['id', 'email', 'name']),
        raw: true,
      });
    });
  });

  describe('delete', () => {
    it('should call destroy on UserProfile table and return deleted value', async () => {
      db.UserProfile.findByPk.mockResolvedValueOnce({
        toJSON: () => mockUser,
      });
      db.UserProfile.destroy.mockResolvedValueOnce(1);

      const result = await deleteUser(mockUser.id, mockTransaction);

      expect(result).toEqual(mockUser);
      expect(db.UserProfile.destroy).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        transaction: mockTransaction,
      });
    });

    it('should skip destroy when findByPk returns nothing', async () => {
      db.UserProfile.findByPk.mockResolvedValueOnce(undefined);

      const result = await deleteUser(uuid.v4());

      expect(result).toEqual(undefined);
      expect(db.UserProfile.destroy).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should truncate the UserProfile table', async () => {
      await clear();
      expect(db.UserProfile.destroy).toHaveBeenCalledWith({
        truncate: true,
        cascade: true,
        force: true,
      });
    });
  });

  describe('getByStripeSubscription', () => {
    it('should find user using stripe subscription', async () => {
      db.UserProfile.findOne.mockResolvedValueOnce(mockUser);
      const result = await getByStripeSubscription(
        mockUser.stripeSubscriptionId,
        mockUser.stripeCustomerId,
      );

      expect(result).toEqual(mockUser);
      expect(db.UserProfile.findOne).toHaveBeenCalledWith({
        where: {
          stripeCustomerId: mockUser.stripeCustomerId,
          stripeSubscriptionId: mockUser.stripeSubscriptionId,
        },
        raw: true,
      });
    });
  });

  describe('getByStripeCustomer', () => {
    it('should find user using stripe customer id', async () => {
      db.UserProfile.findOne.mockResolvedValueOnce(mockUser);
      const result = await getByStripeCustomer(mockUser.stripeCustomerId);

      expect(result).toEqual(mockUser);
      expect(db.UserProfile.findOne).toHaveBeenCalledWith({
        where: {
          stripeCustomerId: mockUser.stripeCustomerId,
        },
        raw: true,
      });
    });
  });

  describe('getPushSubscriptions', () => {
    it('should fetch webpush and mobile push detail from UserProfile', async () => {
      const mockUsers = Array(5)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            email: faker.internet.email(),
            language: 'en',
            webpushSubscription: {
              endpoint: faker.internet.url(),
              expirationTime: null,
              keys: {
                p256dh: faker.random.alphaNumeric(90),
                auth: faker.random.alphaNumeric(20),
              },
            },
            mobilePushSubscription: null,
          };
        });
      db.UserProfile.findAll.mockResolvedValueOnce(mockUsers);
      const result = await getPushSubscriptions(mockUsers.map((row) => row.id));

      expect(result).toEqual(mockUsers);
      expect(db.UserProfile.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: mockUsers.map((row) => row.id),
          },
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'setting',
            attributes: expect.arrayContaining([
              'emailNotificationSettings',
              'browserNotificationSettings',
              'mobileNotificationSettings',
              'persistentNotificationSettings',
            ]),
            required: false,
          }),
        ]),
        attributes: expect.arrayContaining([
          'id',
          'email',
          'language',
          'webpushSubscription',
          'mobilePushSubscription',
        ]),
      });
    });
  });

  describe('getNearbyUsers', () => {
    it('should find and return all nearby user within specified radius', async () => {
      const mockUsers = Array(5)
        .fill()
        .map(() => {
          return { id: uuid.v4(), name: faker.name.findName() };
        });
      db.UserProfile.findAll.mockResolvedValueOnce(mockUsers);
      const lon = faker.address.longitude();
      const lat = faker.address.latitude();
      const radius = 10;

      const result = await getNearbyUsers({ lon, lat }, radius);

      expect(result).toEqual(mockUsers);
      expect(db.UserProfile.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining(['id', 'name']),
        where: db.Sequelize.where(
          db.Sequelize.fn(
            'ST_DWithin',
            db.Sequelize.literal('"lastLocation"'),
            db.Sequelize.literal(`ST_MakePoint(:lon,:lat)::geography`),
            radius,
          ),
          true,
        ),
        replacements: { lon: +lon, lat: +lat },
      });
    });
  });

  describe('claimAnonymousUser', () => {
    it('should convert an anonymous user to a registered user, claiming all their data', async () => {
      const anonymousId = uuid.v4();
      const userId = uuid.v4();
      const defaultVesselId = uuid.v4();
      const updateCalls = [
        db.CalendarEvent,
        db.VesselParticipantGroup,
        db.Course,
        db.CourseSequencedGeometry,
        db.CourseUnsequencedTimedGeometry,
        db.CourseUnsequencedUntimedGeometry,
        db.CoursePoint,
        db.CompetitionUnit,
        db.VesselParticipant,
        db.VesselParticipantCrew,
        db.TrackHistory,
        db.Participant,
        db.MarkTracker,
        db.VesselEditor,
        db.UserNotification,
      ];
      const destroyCalls = [db.Vessel];

      let updateCount = 0;
      updateCalls.forEach((table) => {
        table.update.mockResolvedValueOnce([1, undefined]);
        updateCount++;
      });
      let deleteCount = 0;
      destroyCalls.forEach((table) => {
        table.destroy.mockResolvedValueOnce(1);
        updateCount++;
      });

      const result = await claimAnonymousUser(
        { anonymousId, userId, defaultVesselId },
        mockTransaction,
      );

      expect(result).toEqual(updateCount + deleteCount);
      updateCalls.forEach((model) => {
        expect(model.update).toHaveBeenCalledTimes(1);
      });
      destroyCalls.forEach((model) => {
        expect(model.destroy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
