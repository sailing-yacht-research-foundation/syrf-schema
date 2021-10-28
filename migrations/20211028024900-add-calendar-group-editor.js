'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let tableInfo;
    try {
      tableInfo = await queryInterface.describeTable('CalendarGroupEditors');
    } catch (err) {
      tableInfo = null;
    }

    if (!tableInfo) {
      await queryInterface.createTable('CalendarGroupEditors', {
        groupId: {
          type: Sequelize.DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
        },
        calendarEventId: {
          type: Sequelize.DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
        },
        createdAt: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
        },
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('CalendarGroupEditors');
  },
};
