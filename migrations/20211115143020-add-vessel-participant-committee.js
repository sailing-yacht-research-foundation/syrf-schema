'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('VesselParticipants');
    if (!tableInfo.isCommittee) {
      await queryInterface.addColumn(
        'VesselParticipants',
        'isCommittee',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('VesselParticipants', 'isCommittee');
  }
};
