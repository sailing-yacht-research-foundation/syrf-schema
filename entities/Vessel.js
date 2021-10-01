const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class Vessel extends ModelBase {
  static associate(models) {
    this.hasMany(models.VesselParticipant, {
      as: 'vesselParticipants',
      constraints: false,
      foreignKey: 'vesselId',
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
      },
      bulkCreated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      modelName: 'Vessel',
      sequelize,
    },
  );
  return Vessel;
};
