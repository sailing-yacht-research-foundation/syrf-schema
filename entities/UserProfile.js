const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class UserProfile extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsToMany(models.VesselParticipant, {
      through: 'VesselParticipantEditors',
      as: 'vesselParticipantEditors',
      constraints: false,
    });

    this.belongsToMany(models.CalendarEvent, {
      through: 'CalendarEditors',
      as: 'calendarEditors',
      constraints: false,
    });

    this.belongsToMany(models.Vessel, {
      through: 'VesselEditors',
      as: 'vesselEditors',
      constraints: false,
      foreignKey: 'userProfileId',
      otherKey: 'vesselId',
    });

    this.hasMany(models.UserFollower, {
      as: 'follower',
      constraints: false,
      foreignKey: 'userId',
    });

    this.hasMany(models.UserFollower, {
      as: 'following',
      constraints: false,
      foreignKey: 'followerId',
    });

    this.hasMany(models.TrackHistory, {
      as: 'tracks',
      foreignKey: 'userProfileId',
      constraints: false,
    });

    this.hasMany(models.UserStream, {
      as: 'streams',
      foreignKey: 'userId',
      constraints: false,
    });

    this.hasMany(models.ParticipationCharge, {
      as: 'participationCharge',
      foreignKey: 'userId',
      constraints: false,
    });

    this.belongsTo(models.SubscriptionTier, {
      as: 'subscription',
      constraints: false,
      foreignKey: 'subscriptionTier',
    });

    this.hasOne(models.UserShareableInfo, {
      as: 'shareables',
      constraints: false,
      sourceKey: 'id',
      foreignKey: 'userId',
    });

    this.hasMany(models.UserNotification, {
      as: 'notification',
      foreignKey: 'userId',
      constraints: false,
    });

    this.hasOne(models.UserSetting, {
      as: 'setting',
      foreignKey: 'id',
      constraints: false,
    });

    this.belongsTo(models.Developer, {
      as: 'developerAccount',
      constraints: false,
      foreignKey: 'developerAccountId',
    });
  }
}

module.exports = (sequelize) => {
  UserProfile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      sub: {
        type: DataTypes.STRING,
      },
      address: {
        type: DataTypes.STRING,
      },
      birthdate: {
        type: DataTypes.DATEONLY,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
      },
      name: {
        type: DataTypes.STRING,
      },
      phone_number_verified: {
        type: DataTypes.BOOLEAN,
      },
      phone_number: {
        type: DataTypes.STRING,
      },
      country: {
        type: DataTypes.STRING,
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en',
      },
      email: {
        type: DataTypes.STRING,
      },
      role: {
        type: DataTypes.STRING,
      },
      publicId: {
        type: DataTypes.STRING,
      },
      signupType: {
        type: DataTypes.STRING,
      },
      avatar: {
        type: DataTypes.STRING,
      },
      acceptEulaVersion: {
        type: DataTypes.STRING,
      },
      acceptEulaTimestamp: {
        type: DataTypes.DATE,
      },
      acceptPrivacyPolicyVersion: {
        type: DataTypes.STRING,
      },
      acceptPrivacyPolicyTimestamp: {
        type: DataTypes.DATE,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      bio: {
        type: DataTypes.TEXT,
      },
      sailingNumber: {
        type: DataTypes.STRING,
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subscriptionTier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subscriptionExpireDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      latestInvoice: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      interests: {
        type: DataTypes.JSONB,
      },
      isStreamer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      hasVerifiedStripePayment: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      webpushSubscription: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      mobilePushSubscription: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        comment: 'FCM registration token for logged in device',
      },
      lastLocation: {
        type: DataTypes.GEOMETRY('POINT', 4326),
      },
    },
    {
      modelName: 'UserProfile',
      sequelize,
    },
  );
  return UserProfile;
};
