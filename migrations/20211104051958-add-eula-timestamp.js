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
      if (!tableInfo.acceptPrivacyPolicyVersion) {
        await queryInterface.addColumn(
          'UserProfiles',
          'acceptPrivacyPolicyVersion',
          Sequelize.STRING,
          { transaction },
        );
      }
      if (!tableInfo.acceptPrivacyPolicyTimestamp) {
        await queryInterface.addColumn(
          'UserProfiles',
          'acceptPrivacyPolicyTimestamp',
          Sequelize.STRING,
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
      if (tableInfo.acceptPrivacyPolicyVersion) {
        await queryInterface.removeColumn(
          'UserProfiles',
          'acceptPrivacyPolicyVersion',
          {
            transaction,
          },
        );
      }
      if (tableInfo.acceptPrivacyPolicyTimestamp) {
        await queryInterface.removeColumn(
          'UserProfiles',
          'acceptPrivacyPolicyTimestamp',
          {
            transaction,
          },
        );
      }
    });
  },
};
