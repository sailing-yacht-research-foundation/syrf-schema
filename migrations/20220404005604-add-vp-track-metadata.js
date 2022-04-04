'use strict';

const tableName = 'VesselParticipantTrackMetadatas';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let table;
      try {
        table = await queryInterface.describeTable(tableName);
      } catch (err) {
        table = null;
      }
      if (!table) {
        await queryInterface.createTable(
          tableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            trackId: {
              type: Sequelize.DataTypes.UUID,
              comment:
                'uuid to vesselParticipantTrackJsons, nullable, should be updated upon saving Competition data on AE',
            },
            competitionUnitId: {
              type: DataTypes.UUID,
              allowNull: false,
            },
            vesselParticipantId: {
              type: DataTypes.UUID,
              allowNull: false,
            },
            elapsedTime: {
              type: Sequelize.DataTypes.BIGINT,
              allowNull: false,
            },
            timeRankInCompetition: {
              type: Sequelize.DataTypes.INTEGER,
            },
            totalTraveledDistance: {
              type: Sequelize.DataTypes.DOUBLE,
              allowNull: false,
              defaultValue: 0,
            },
            ttdRankInCompetition: {
              type: Sequelize.DataTypes.INTEGER,
            },
            // SOG
            worstSog: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            worstSogLocation: {
              type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
            },
            avgSog: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            bestSog: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            bestSogLocation: {
              type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
            },
            sogRankInCompetition: {
              type: Sequelize.DataTypes.INTEGER,
            },
            // VMG
            worstVmg: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            worstVmgLocation: {
              type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
            },
            avgVmg: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            bestVmg: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            bestVmgLocation: {
              type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
            },
            vmgRankInCompetition: {
              type: Sequelize.DataTypes.INTEGER,
            },
            // VMC
            worstVmc: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            worstVmcLocation: {
              type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
            },
            avgVmc: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            bestVmc: {
              type: Sequelize.DataTypes.DOUBLE,
            },
            bestVmcLocation: {
              type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
            },
            vmcRankInCompetition: {
              type: Sequelize.DataTypes.INTEGER,
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
      let table;
      try {
        table = await queryInterface.describeTable(tableName);
      } catch (err) {
        table = null;
      }
      if (table) {
        await queryInterface.dropTable(tableName, {
          transaction,
        });
      }
    });
  },
};
