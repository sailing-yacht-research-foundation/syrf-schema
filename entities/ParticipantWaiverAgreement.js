const { DataTypes } = require('sequelize');
const { waiverTypes } = require('../enums');
const ModelBase = require('../ModelBase');

class ParticipantWaiverAgreement extends ModelBase {
  static associateBase() {}
  static associate(models) {
    this.belongsTo(models.Participant, {
      as: 'participant',
      constraints: false,
      foreignKey: 'participantId',
    });
  }
}

module.exports = (sequelize) => {
  ParticipantWaiverAgreement.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      participantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      waiverType: {
        type: DataTypes.ENUM(Object.values(waiverTypes)),
        allowNull: false,
      },
      agreedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: 'ParticipantWaiverAgreement',
      sequelize,
    },
  );
  return ParticipantWaiverAgreement;
};
