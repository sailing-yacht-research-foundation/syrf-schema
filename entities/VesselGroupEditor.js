const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class VesselGroupEditor extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.Vessel, {
      as: 'vessel',
      constraints: false,
      foreignKey: 'vesselId',
    });
    this.belongsTo(models.Group, {
      as: 'group',
      constraints: false,
      foreignKey: 'groupId',
    });
  }
}

module.exports = (sequelize) => {
  VesselGroupEditor.init(
    {
      groupId: {
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
      modelName: 'VesselGroupEditor',
      sequelize,
    },
  );
  return VesselGroupEditor;
};
