'use strict';

const { externalServiceSources } = require('../enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let tableInfo;
    try {
      tableInfo = await queryInterface.describeTable(
        'ExternalServiceCredentials',
      );
    } catch (err) {
      tableInfo = null;
    }

    if (!tableInfo) {
      await queryInterface.createTable(
        'ExternalServiceCredentials',
        {
          id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
          },
          userProfileId: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
          },
          source: {
            type: Sequelize.DataTypes.ENUM(
              Object.values(externalServiceSources),
            ),
            allowNull: false,
          },
          userId: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
          },
          password: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: Sequelize.DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: Sequelize.DataTypes.DATE,
            allowNull: false,
          },
        },
        {
          uniqueKeys: {
            uniqueUserCredentials: {
              customIndex: true,
              fields: ['userProfileId', 'source', 'userId'],
            },
          },
        },
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ExternalServiceCredentials');
  },
};
