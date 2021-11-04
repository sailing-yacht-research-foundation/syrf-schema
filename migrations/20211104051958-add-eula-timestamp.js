'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable('UserProfiles');
      if (!tableInfo.acceptEulaVersion) {
        await queryInterface.addColumn(
          'UserProfiles',
          'acceptEulaVersion',
          Sequelize.STRING,
          { transaction },
        );
      }
      if (!tableInfo.acceptEulaTimestamp) {
        await queryInterface.addColumn(
          'UserProfiles',
          'acceptEulaTimestamp',
          Sequelize.DATE,
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableInfo = await queryInterface.describeTable('UserProfiles');
      if (tableInfo.acceptEulaVersion) {
        await queryInterface.removeColumn('UserProfiles', 'acceptEulaVersion', {
          transaction,
        });
      }
      if (tableInfo.acceptEulaTimestamp) {
        await queryInterface.removeColumn(
          'UserProfiles',
          'acceptEulaTimestamp',
          {
            transaction,
          },
        );
      }
    });
  },
};
