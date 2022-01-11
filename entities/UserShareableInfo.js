const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class UserShareableInfo extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'userId',
    });
  }
}

module.exports = (sequelize) => {
  UserShareableInfo.init(
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      emergencyContactName: {
        type: DataTypes.STRING,
      },
      emergencyContactPhone: {
        type: DataTypes.STRING,
      },
      emergencyContactEmail: {
        type: DataTypes.STRING,
      },
      emergencyContactRelationship: {
        type: DataTypes.STRING,
      },
      foodAllergies: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      epirbBeaconHexId: {
        type: DataTypes.STRING,
      },
      certifications: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      medicalProblems: {
        type: DataTypes.STRING,
        comment: 'Contains array of string json, encrypted',
      },
      covidVaccinationCard: {
        type: DataTypes.STRING,
      },
      tShirtSize: {
        type: DataTypes.STRING,
      },
      passportNumber: {
        type: DataTypes.STRING,
      },
      passportIssueDate: {
        type: DataTypes.DATEONLY,
      },
      passportExpirationDate: {
        type: DataTypes.DATEONLY,
      },
      passportIssueCountry: {
        type: DataTypes.STRING,
      },
      passportPhoto: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: 'UserShareableInfo',
      sequelize,
    },
  );
  return UserShareableInfo;
};
