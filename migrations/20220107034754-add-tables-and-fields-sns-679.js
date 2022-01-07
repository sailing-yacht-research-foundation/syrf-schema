'use strict';
const { DataTypes } = require('sequelize');

const { vesselTypeEnums } = require('../enums');

const vesselTableName = 'Vessels';
const newVesselColumns = [
  {
    columnName: 'vesselType',
    type: DataTypes.ENUM(Object.values(vesselTypeEnums)),
  },
  {
    // Not clear whether to support only 1 photo or multiple,
    // but array of string should work best for both so no updates required in the future
    columnName: 'photo',
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  {
    columnName: 'hullsCount',
    type: DataTypes.SMALLINT,
    comment: 'Should be one of 1, 2, or 3',
  },
  {
    columnName: 'hullDiagram',
    type: DataTypes.STRING,
    comment: 'image',
  },
  {
    columnName: 'deckPlan',
    type: DataTypes.STRING,
    comment: 'image',
  },
  {
    columnName: 'sailNumber',
    type: DataTypes.STRING,
  },
  {
    columnName: 'callSign',
    type: DataTypes.STRING,
  },
  {
    columnName: 'mmsi',
    type: DataTypes.STRING,
  },
  {
    columnName: 'mobilePhoneOnboard',
    type: DataTypes.STRING,
  },
  {
    columnName: 'satelliteNumber',
    type: DataTypes.STRING,
  },
  {
    columnName: 'onboardEmail',
    type: DataTypes.STRING,
  },
  {
    columnName: 'ssbTransceiver',
    type: DataTypes.STRING,
  },
  {
    columnName: 'deckColor',
    type: DataTypes.STRING,
  },
  {
    columnName: 'hullColorAboveWaterline',
    type: DataTypes.STRING,
  },
  {
    columnName: 'hullColorBelowWaterline',
    type: DataTypes.STRING,
  },
  {
    columnName: 'hullNumber',
    type: DataTypes.STRING,
  },
  {
    columnName: 'rigging',
    type: DataTypes.STRING,
  },
  {
    columnName: 'homeport',
    type: DataTypes.STRING,
  },
  {
    columnName: 'marinaPhoneNumber',
    type: DataTypes.STRING,
  },
  {
    columnName: 'epirbHexId',
    type: DataTypes.STRING,
  },
  {
    columnName: 'equipmentManualPdfs',
    type: DataTypes.JSON,
  },
];

const lifeRaftTableName = 'VesselLifeRafts';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const vesselTable = await queryInterface.describeTable(vesselTableName);

      newVesselColumns.map(async (col) => {
        if (!vesselTable[col.columnName]) {
          await queryInterface.addColumn(
            vesselTableName,
            col.columnName,
            Object.assign(
              {},
              {
                type: col.type,
              },
              col.allowNull
                ? {
                    allowNull: col.allowNull,
                  }
                : {},
              col.comment
                ? {
                    comment: col.comment,
                  }
                : {},
            ),
            { transaction },
          );
        }
      });

      let lifeRaftTable;
      try {
        lifeRaftTable = await queryInterface.describeTable(lifeRaftTableName);
      } catch (err) {
        lifeRaftTable = null;
      }

      if (!lifeRaftTable) {
        await queryInterface.createTable(
          lifeRaftTableName,
          {
            id: {
              type: Sequelize.DataTypes.UUID,
              defaultValue: Sequelize.DataTypes.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            vesselId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
            },
            serialNumber: {
              type: Sequelize.DataTypes.STRING,
            },
            capacity: {
              type: Sequelize.DataTypes.STRING,
            },
            manufacturer: {
              type: Sequelize.DataTypes.STRING,
            },
            model: {
              type: Sequelize.DataTypes.STRING,
            },
            container: {
              type: Sequelize.DataTypes.STRING,
            },
            lastServiceDate: {
              type: Sequelize.DataTypes.DATE,
            },
            manufactureDate: {
              type: Sequelize.DataTypes.DATE,
            },
            ownership: {
              type: Sequelize.DataTypes.ENUM(Object.values(vesselTypeEnums)),
            },
            verifyDate: {
              type: Sequelize.DataTypes.DATE,
            },
            verifierUserId: {
              type: Sequelize.DataTypes.UUID,
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            createdById: {
              type: Sequelize.DataTypes.UUID,
            },
            updatedAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            updatedById: {
              type: Sequelize.DataTypes.UUID,
            },
            developerId: {
              type: Sequelize.DataTypes.UUID,
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
      newVesselColumns.map(async (col) => {
        await queryInterface.removeColumn(vesselTableName, col.columnName, {
          transaction,
        });
      });

      let lifeRaftTable;
      try {
        lifeRaftTable = await queryInterface.describeTable(lifeRaftTableName);
      } catch (err) {
        lifeRaftTable = null;
      }

      if (lifeRaftTable) {
        await queryInterface.dropTable(lifeRaftTableName, {
          transaction,
        });
      }
    });
  },
};
