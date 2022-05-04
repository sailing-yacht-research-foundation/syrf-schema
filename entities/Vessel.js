const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');
const { vesselTypeEnums } = require('../enums');

class Vessel extends ModelBase {
  static associate(models) {
    this.hasMany(models.VesselParticipant, {
      as: 'vesselParticipants',
      constraints: false,
      foreignKey: 'vesselId',
    });
    this.belongsToMany(models.UserProfile, {
      through: 'VesselEditors',
      as: 'editors',
      constraints: false,
      foreignKey: 'vesselId',
      otherKey: 'userProfileId',
    });
    this.belongsToMany(models.Group, {
      through: 'VesselGroupEditors',
      as: 'groupEditors',
      constraints: false,
      foreignKey: 'vesselId',
      otherKey: 'groupId',
    });
  }
}

module.exports = (sequelize) => {
  Vessel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      vesselId: {
        type: DataTypes.STRING,
      },
      globalId: {
        type: DataTypes.STRING,
      },
      lengthInMeters: {
        type: DataTypes.FLOAT,
      },
      publicName: {
        type: DataTypes.STRING,
      },
      orcJsonPolars: {
        type: DataTypes.JSON,
      },
      scope: {
        type: DataTypes.UUID,
        comment:
          'used to scope vessel. ex: scope a vessel to an event so it cant be used in other event',
      },
      bulkCreated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      model: {
        type: DataTypes.STRING,
      },
      widthInMeters: {
        type: DataTypes.FLOAT,
      },
      draftInMeters: {
        type: DataTypes.FLOAT,
      },
      handicap: {
        type: DataTypes.JSON,
      },
      source: {
        type: DataTypes.STRING,
      },
      vesselType: {
        type: DataTypes.ENUM(Object.values(vesselTypeEnums)),
      },
      photo: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      hullsCount: {
        type: DataTypes.SMALLINT,
        comment: 'Should be one of 1, 2, or 3',
      },
      hullDiagram: {
        type: DataTypes.STRING,
        comment: 'image',
      },
      deckPlan: {
        type: DataTypes.STRING,
        comment: 'image',
      },
      sailNumber: {
        type: DataTypes.STRING,
      },
      callSign: {
        type: DataTypes.STRING,
      },
      mmsi: {
        type: DataTypes.STRING,
      },
      onboardPhone: {
        type: DataTypes.STRING,
      },
      isVerifiedOnboardPhone: {
        type: DataTypes.BOOLEAN,
      },
      satelliteNumber: {
        type: DataTypes.STRING,
      },
      isVerifiedSatelliteNumber: {
        type: DataTypes.BOOLEAN,
      },
      onboardEmail: {
        type: DataTypes.STRING,
      },
      isVerifiedOnboardEmail: {
        type: DataTypes.BOOLEAN,
      },
      ssbTransceiver: {
        type: DataTypes.STRING,
      },
      deckColor: {
        type: DataTypes.STRING,
      },
      hullColorAboveWaterline: {
        type: DataTypes.STRING,
      },
      hullColorBelowWaterline: {
        type: DataTypes.STRING,
      },
      hullNumber: {
        type: DataTypes.STRING,
      },
      rigging: {
        type: DataTypes.STRING,
      },
      homeport: {
        type: DataTypes.STRING,
      },
      marinaPhoneNumber: {
        type: DataTypes.STRING,
      },
      epirbHexId: {
        type: DataTypes.STRING,
      },
      equipmentManualPdfs: {
        type: DataTypes.JSON,
      },
      isDefaultVessel: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      modelName: 'Vessel',
      sequelize,
      paranoid: true,
    },
  );
  return Vessel;
};
