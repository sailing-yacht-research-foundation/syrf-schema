'use strict';

const tableName = 'UserNotifications';
module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addIndex(tableName, ['readAt'], {
        unique: false,
        transaction,
        name: 'user_notification_read_at_index',
      });
      await queryInterface.addIndex(tableName, ['createdAt'], {
        unique: false,
        transaction,
        name: 'user_notification_created_at_index',
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex(
        tableName,
        'user_notification_read_at_index',
        { transaction },
      );
      await queryInterface.removeIndex(
        tableName,
        'user_notification_created_at_index',
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
