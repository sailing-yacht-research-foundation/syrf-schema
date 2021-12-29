'use strict';

const { participantInvitationStatus } = require('../enums');
const db = require('../index');

const tableName = 'Participants';

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
    const table = await queryInterface.describeTable(tableName);

    if (!table.invitationStatus) {
      await queryInterface.addColumn(tableName, 'invitationStatus', {
        type: Sequelize.DataTypes.ENUM(
          Object.values(participantInvitationStatus),
        ),
      });

      // update previous data to be accepted to prevent breaks
      await db.Participant.update(
        {
          invitationStatus: participantInvitationStatus.ACCEPTED,
        },
        {
          where: {
            invitationStatus: null,
          },
        },
      );
    }
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable(tableName);
    if (table.invitationStatus) {
      await Sequelize.transaction(async (transaction) => {
        await queryInterface.removeColumn(tableName, 'invitationStatus', {
          transaction,
        });
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_Participants_invitationStatus";',
          { transaction },
        );
      });
    }
  },
};
