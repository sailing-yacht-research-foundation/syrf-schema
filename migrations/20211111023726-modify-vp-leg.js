'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(
        'VesselParticipantLegs',
      );
      if (tableInfo.averageCourseDerivedTWA) {
        await queryInterface.changeColumn(
          'VesselParticipantLegs',
          'averageCourseDerivedTWA',
          { type: Sequelize.DOUBLE, allowNull: true },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable(
        'VesselParticipantLegs',
      );
      if (tableInfo.averageCourseDerivedTWA) {
        await queryInterface.changeColumn(
          'VesselParticipantLegs',
          'averageCourseDerivedTWA',
          { type: Sequelize.DOUBLE, allowNull: false },
          {
            transaction,
          },
        );
      }
    });
  },
};
