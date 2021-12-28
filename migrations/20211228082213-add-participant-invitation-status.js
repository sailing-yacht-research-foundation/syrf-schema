'use strict';

const { participantInvitationStatus } = require('../enums');

const tableName = 'Participants';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);

    if (!table.invitationStatus) {
      await queryInterface.addColumn(tableName, 'invitationStatus', {
        type: Sequelize.DataTypes.ENUM(
          Object.values(participantInvitationStatus),
        ),
      });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable(tableName);
    if (table.invitationStatus)
      await queryInterface.removeColumn(tableName, 'invitationStatus');
  },
};
