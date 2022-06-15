'use strict';

const vpTrackTableName = 'VesselParticipantTracks';
const ptTrackTableName = 'CompetitionPointTracks';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let vpTable;
      try {
        vpTable = await queryInterface.describeTable(vpTrackTableName);
      } catch (err) {
        vpTable = null;
      }

      if (vpTable) {
        await queryInterface.dropTable(vpTrackTableName, { transaction });
      }

      let ptTable;
      try {
        ptTable = await queryInterface.describeTable(ptTrackTableName);
      } catch (err) {
        ptTable = null;
      }

      if (ptTable) {
        await queryInterface.dropTable(ptTrackTableName, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let vpTable;
      try {
        vpTable = await queryInterface.describeTable(vpTrackTableName);
      } catch (err) {
        vpTable = null;
      }

      if (!vpTable) {
        await queryInterface.createTable(vpTrackTableName, {
          id: {
            type: Sequelize.DataTypes.UUID,
            defaultValue: Sequelize.DataTypes.UUIDV1,
            allowNull: false,
            primaryKey: true,
          },
          competitionUnitId: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
          },
          vesselParticipantId: {
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
          derivedCOG: {
            type: Sequelize.DataTypes.DOUBLE,
            allowNull: true,
          },
          derivedSOG: {
            type: Sequelize.DataTypes.DOUBLE,
            allowNull: true,
          },
          derivedTWA: {
            type: Sequelize.DataTypes.DOUBLE,
            allowNull: true,
          },
          windSpeed: {
            type: Sequelize.DataTypes.DOUBLE,
            allowNull: true,
          },
          windDirection: {
            type: Sequelize.DataTypes.DOUBLE,
            allowNull: true,
          },
        });
      }

      let ptTable;
      try {
        ptTable = await queryInterface.describeTable(ptTrackTableName);
      } catch (err) {
        ptTable = null;
      }

      if (!ptTable) {
        await queryInterface.createTable(ptTrackTableName, {
          id: {
            type: Sequelize.DataTypes.UUID,
            defaultValue: Sequelize.DataTypes.UUIDV1,
            allowNull: false,
            primaryKey: true,
          },
          competitionUnitId: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
          },
          pointId: {
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
        });
      }
    });
  },
};
