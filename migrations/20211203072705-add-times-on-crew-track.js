'use strict';

const tableName = 'VesselParticipantCrewTrackJsons';
const unusedTableName = 'VesselParticipantCrewTracks';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable(tableName);

      if (!table.startTime) {
        await queryInterface.addColumn(
          tableName,
          'startTime',
          {
            type: Sequelize.DataTypes.DATE,
          },
          { transaction },
        );
      }
      if (!table.endTime) {
        await queryInterface.addColumn(
          tableName,
          'endTime',
          {
            type: Sequelize.DataTypes.DATE,
          },
          { transaction },
        );
      }

      let unusedTable;
      try {
        unusedTable = await queryInterface.describeTable(unusedTableName);
      } catch (err) {
        unusedTable = null;
      }
      if (unusedTable) {
        await queryInterface.dropTable(unusedTableName, {
          transaction,
        });
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(tableName, 'startTime', {
        transaction,
      });
      await queryInterface.removeColumn(tableName, 'endTime', {
        transaction,
      });
      let unusedTable;
      try {
        unusedTable = await queryInterface.describeTable(unusedTableName);
      } catch (err) {
        unusedTable = null;
      }
      if (!unusedTable) {
        await queryInterface.createTable(
          unusedTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            vesselParticipantCrewId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            competitionUnitId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            position: {
              type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
              allowNull: false,
            },
            pingTime: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            cog: {
              type: Sequelize.DataTypes.DOUBLE,
              allowNull: true,
              comment: 'Heading of the vessel',
            },
            sog: {
              type: Sequelize.DataTypes.DOUBLE,
              allowNull: true,
              comment: 'Speed of the vessel',
            },
            twa: {
              type: Sequelize.DataTypes.DOUBLE,
              allowNull: true,
              comment: 'True wind Angle',
            },
            setDrift: {
              type: Sequelize.DataTypes.DOUBLE,
              allowNull: true,
            },
          },
          {
            transaction,
          },
        );
      }
    });
  },
};
