const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class VesselEditor extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.Vessel, {
      as: 'vessel',
      constraints: false,
      foreignKey: 'vesselId',
    });
    this.belongsTo(models.UserProfile, {
      as: 'user',
      constraints: false,
      foreignKey: 'userProfileId',
    });
  }
}

module.exports = (sequelize) => {
  VesselEditor.init(
    {
      userProfileId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      vesselId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      modelName: 'VesselEditor',
      sequelize,
    },
  );
  return VesselEditor;
};
