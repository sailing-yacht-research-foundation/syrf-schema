const { userSignupType } = require('../../enums');
const db = require('../../index');
const { Op } = require('../../index');
exports.upsert = async (userProfile = {}, transaction) => {
  const [result] = await db.UserProfile.upsert(
    {
      ...userProfile,
    },
    { transaction },
  );

  return result.toJSON();
};

exports.updateProfile = async (userId, userProfile = {}, transaction) => {
  const result = await db.UserProfile.update(userProfile, {
    where: {
      id: userId,
    },
    transaction,
  });

  return result;
};

exports.acceptEula = async (data, userId) => {
  const [updateCount] = await db.UserProfile.update(data, {
    where: {
      id: userId,
      signupType: userSignupType.REGISTERED,
    },
  });

  return updateCount;
};

exports.getById = async (sub) => {
  return await db.UserProfile.findByPk(sub, {
    raw: true,
  });
};

exports.getBySub = async (sub) => {
  return await db.UserProfile.findOne(
    { where: { sub } },
    {
      raw: true,
    },
  );
};

exports.getAllByEmail = async (emails) => {
  return await db.UserProfile.findAll({
    where: {
      email: {
        [Op.in]: emails,
      },
    },
    raw: true,
  });
};

exports.getAllById = async (ids, attributes) => {
  return await db.UserProfile.findAll({
    attributes,
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    raw: true,
  });
};

exports.getAllRegisteredUser = async () => {
  return await db.UserProfile.findAll({
    where: {
      signupType: userSignupType.REGISTERED,
    },
    attributes: ['id', 'email', 'name'],
    raw: true,
  });
};

exports.delete = async (sub, transaction) => {
  const data = await db.UserProfile.findByPk(sub);

  if (data) {
    await db.UserProfile.destroy({
      attributes: ['id', 'email', 'name'],
      where: {
        id: sub,
      },
      transaction,
    });
  }

  return data?.toJSON();
};

exports.clear = async () => {
  await db.UserProfile.destroy({
    truncate: true,
    cascade: true,
    force: true,
  });
};

exports.getByStripeSubscription = async (
  stripeSubscriptionId,
  stripeCustomerId,
) => {
  return await db.UserProfile.findOne({
    where: {
      stripeCustomerId,
      stripeSubscriptionId,
    },
    raw: true,
  });
};

exports.getByStripeCustomer = async (stripeCustomerId) => {
  return await db.UserProfile.findOne({
    where: {
      stripeCustomerId,
    },
    raw: true,
  });
};

exports.getPushSubscriptions = async (ids) => {
  const data = await db.UserProfile.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    include: [
      {
        model: db.UserSetting,
        as: 'setting',
        attributes: [
          'emailNotificationSettings',
          'browserNotificationSettings',
          'mobileNotificationSettings',
          'persistentNotificationSettings',
        ],
        required: false,
      },
    ],
    attributes: [
      'id',
      'email',
      'language',
      'webpushSubscription',
      'mobilePushSubscription',
    ],
  });
  return data;
};

exports.getNearbyUsers = async ({ lon, lat }, radius) => {
  const data = await db.UserProfile.findAll({
    attributes: ['id', 'name'],
    where: db.Sequelize.where(
      db.Sequelize.fn(
        'ST_DWithin',
        db.Sequelize.literal('"lastLocation"'),
        db.Sequelize.literal(`ST_MakePoint(:lon,:lat)::geography`),
        radius,
      ),
      true,
    ),
    replacements: { lon: parseFloat(lon), lat: parseFloat(lat) },
  });
  return data;
};

exports.claimAnonymousUser = async (
  { anonymousId, userId, defaultVesselId },
  transaction,
) => {
  const claimCreatedBy = [
    {
      createdById: userId,
    },
    {
      where: {
        createdById: anonymousId,
      },
      transaction,
    },
  ];
  const claimCreatedByAndUserProfile = [
    {
      createdById: userId,
      userProfileId: userId,
    },
    {
      where: {
        userProfileId: anonymousId,
      },
      transaction,
    },
  ];

  const result = await Promise.all([
    db.CalendarEvent.update(
      {
        ownerId: userId,
        createdById: userId,
      },
      {
        where: {
          ownerId: anonymousId,
        },
        transaction,
      },
    ),
    db.VesselParticipantGroup.update(...claimCreatedBy),
    db.Course.update(...claimCreatedBy),
    db.CourseSequencedGeometry.update(...claimCreatedBy),
    db.CourseUnsequencedTimedGeometry.update(...claimCreatedBy),
    db.CourseUnsequencedUntimedGeometry.update(...claimCreatedBy),
    db.CoursePoint.update(...claimCreatedBy),
    db.CompetitionUnit.update(...claimCreatedBy),
    db.Vessel.destroy({
      where: {
        createdById: anonymousId,
      },
      force: true,
      transaction,
    }),
    db.VesselParticipant.update(
      {
        createdById: userId,
        vesselId: defaultVesselId,
      },
      {
        where: {
          createdById: anonymousId,
        },
        transaction,
      },
    ),
    db.VesselParticipantCrew.update(...claimCreatedBy),
    db.TrackHistory.update(...claimCreatedByAndUserProfile),
    db.Participant.update(...claimCreatedByAndUserProfile),
    db.MarkTracker.update(...claimCreatedByAndUserProfile),
    db.VesselEditor.update(...claimCreatedByAndUserProfile),
    db.UserNotification.update(
      { userId },
      {
        where: {
          userId,
        },
        transaction,
      },
    ),
  ]);

  return result.reduce((total, t) => total + t[0], 0);
};
