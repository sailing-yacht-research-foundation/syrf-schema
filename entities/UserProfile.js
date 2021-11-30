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
      locale: {
        type: DataTypes.STRING,
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
    },
    {
      modelName: 'UserProfile',
      sequelize,
    },
  );
  return UserProfile;
};
