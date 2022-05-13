'use strict';

const calendarEventMessageTableName = 'CalendarEventMessages';
const calendarEventMessageRecipientTableName = 'CalendarEventMessageRecipients';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let calendarEventMessageTable;
      try {
        calendarEventMessageTable = await queryInterface.describeTable(
          calendarEventMessageTableName,
        );
      } catch (err) {
        calendarEventMessageTable = null;
      }
      if (!calendarEventMessageTable) {
        await queryInterface.createTable(
          calendarEventMessageTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            calendarEventId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            senderId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
              comment: 'The admin that sent the message',
            },
            messageContent: {
              type: Sequelize.DataTypes.TEXT,
              allowNull: false,
            },
            recipients: {
              type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.UUID),
              allowNull: true,
              comment: 'null value means blast to all participant',
            },
            sentAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
          },
          {
            transaction,
          },
        );
      }

      let calendarEventMessageRecipientTable;
      try {
        calendarEventMessageRecipientTable = await queryInterface.describeTable(
          calendarEventMessageRecipientTableName,
        );
      } catch (err) {
        calendarEventMessageRecipientTable = null;
      }
      if (!calendarEventMessageRecipientTable) {
        await queryInterface.createTable(
          calendarEventMessageRecipientTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            messageId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            recipientId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
          },
          {
            transaction,
          },
        );
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let calendarEventMessageRecipientTable;
      try {
        calendarEventMessageRecipientTable = await queryInterface.describeTable(
          calendarEventMessageRecipientTableName,
        );
      } catch (err) {
        calendarEventMessageRecipientTable = null;
      }
      if (calendarEventMessageRecipientTable) {
        await queryInterface.dropTable(calendarEventMessageRecipientTableName, {
          transaction,
        });
      }

      let calendarEventMessageTable;
      try {
        calendarEventMessageTable = await queryInterface.describeTable(
          calendarEventMessageTableName,
        );
      } catch (err) {
        calendarEventMessageTable = null;
      }
      if (calendarEventMessageTable) {
        await queryInterface.dropTable(calendarEventMessageTableName, {
          transaction,
        });
      }
    });
  },
};
