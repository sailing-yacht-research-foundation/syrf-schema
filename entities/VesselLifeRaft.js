const { DataTypes } = require('sequelize');

const ModelBase = require('../ModelBase');
const { lifeRaftOwnership } = require('../enums');

class VesselLifeRaft extends ModelBase {
  static associate(models) {
    this.belongsTo(models.Vessel, {
      as: 'vessel',
      foreignKey: 'vesselId',
      constraints: false,
      onDelete: 'cascade',
    });
  }
}

module.exports = (sequelize) => {
  VesselLifeRaft.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      vesselId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      serialNumber: {
        type: DataTypes.STRING,
      },
      capacity: {
        type: DataTypes.STRING,
      },
      manufacturer: {
        type: DataTypes.STRING,
      },
      model: {
        type: DataTypes.STRING,
      },
      container: {
        type: DataTypes.STRING,
      },
      lastServiceDate: {
        type: DataTypes.DATE,
      },
      manufactureDate: {
        type: DataTypes.DATE,
      },
      ownership: {
        type: DataTypes.ENUM(Object.values(lifeRaftOwnership)),
      },
      verifyDate: {
        type: DataTypes.DATE,
      },
      verifierUserId: {
        type: DataTypes.UUID,
      },
    },
    {
      modelName: 'VesselLifeRaft',
      sequelize,
    },
  );
  return VesselLifeRaft;
};
