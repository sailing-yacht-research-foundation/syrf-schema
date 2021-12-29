'use strict';

const { participantInvitationStatus } = require('../enums');

const enumName = 'enum_Participants_invitationStatus';

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */
module.exports = {
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  up: async (queryInterface, Sequelize) => {
    const [existCheck] = await queryInterface.sequelize.query(
      `SELECT enumlabel FROM pg_enum WHERE enumlabel = 'BLOCKED' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = '${enumName}')`,
    );

    if (existCheck.length < 1)
      await queryInterface.sequelize.query(
        `ALTER TYPE "${enumName}" ADD VALUE '${participantInvitationStatus.BLOCKED}'`,
      );
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `DELETE FROM pg_enum WHERE enumlabel = 'BLOCKED' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = '${enumName}')`,
    );
  },
};
