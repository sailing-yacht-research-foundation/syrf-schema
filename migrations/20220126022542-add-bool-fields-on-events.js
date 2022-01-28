'use strict';
const { DataTypes } = require('sequelize');

const calendarEventTableName = 'CalendarEvents';
const newCalendarEventColumns = [
  {
    columnName: 'requireEmergencyContact',
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  {
    columnName: 'requireImmigrationInfo',
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  {
    columnName: 'requireMedicalProblems',
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  {
    columnName: 'requireFoodAllergies',
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
];

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const calendarEventTable = await queryInterface.describeTable(
        calendarEventTableName,
      );
      await Promise.all(
        newCalendarEventColumns.map(async (col) => {
          if (!calendarEventTable[col.columnName]) {
            await queryInterface.addColumn(
              calendarEventTableName,
              col.columnName,
              Object.assign(
                {},
                {
                  type: col.type,
                },
                col.allowNull !== undefined
                  ? {
                      allowNull: col.allowNull,
                    }
                  : {},
                col.comment
                  ? {
                      comment: col.comment,
                    }
                  : {},
                col.defaultValue !== undefined
                  ? {
                      defaultValue: col.defaultValue,
                    }
                  : {},
              ),
              { transaction },
            );
          }
        }),
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      newCalendarEventColumns.map(async (col) => {
        await queryInterface.removeColumn(
          calendarEventTableName,
          col.columnName,
          {
            transaction,
          },
        );
      });
    });
  },
};
