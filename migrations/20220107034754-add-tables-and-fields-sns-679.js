'use strict';
const { DataTypes } = require('sequelize');

const {
  vesselTypeEnums,
  lifeRaftOwnership,
  eventTypeEnums,
  entranceFeeTypes,
} = require('../enums');

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
const vesselEditorTableName = 'VesselEditors';
const vesselGroupEditorTableName = 'VesselGroupEditors';

const userTableName = 'UserProfiles';
const newUserColumns = [
  {
    // Content can be queried. https://sequelize.org/master/manual/other-data-types.html#jsonb--postgresql-only-
    columnName: 'interests',
    type: DataTypes.JSONB,
  },
];

const calendarEventTableName = 'CalendarEvents';
const newCalendarEventColumns = [
  {
    columnName: 'eventTypes',
    type: DataTypes.ENUM(Object.values(eventTypeEnums)),
  },
  {
    columnName: 'hashtag',
    type: DataTypes.STRING,
  },
  {
    columnName: 'entranceFeeType',
    type: DataTypes.ENUM(Object.values(entranceFeeTypes)),
  },
  {
    columnName: 'noticeOfRacePDF',
    type: DataTypes.STRING,
  },
  {
    columnName: 'mediaWaiverPDF',
    type: DataTypes.STRING,
  },
  {
    columnName: 'disclaimerPDF',
    type: DataTypes.STRING,
  },
  {
    columnName: 'isCrewed',
    type: DataTypes.BOOLEAN,
    comment: 'true -> Crewed, false -> SingleHanded',
  },
  {
    columnName: 'crewedMinValue',
    type: DataTypes.SMALLINT,
  },
  {
    columnName: 'crewedMaxValue',
    type: DataTypes.SMALLINT,
  },
];

const userShareableInfoTableName = 'UserShareableInfos';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Vessel Table changes
      const vesselTable = await queryInterface.describeTable(vesselTableName);
      await Promise.all(
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
        }),
      );
      // End of Vessel Table changes

      // Life Raft Table
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
              type: Sequelize.DataTypes.ENUM(Object.values(lifeRaftOwnership)),
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
      // End of life raft table

      // Vessel Editor & Group Editor
      let vesselEditorTable;
      try {
        vesselEditorTable = await queryInterface.describeTable(
          vesselEditorTableName,
        );
      } catch (err) {
        vesselEditorTable = null;
      }
      if (!vesselEditorTable) {
        await queryInterface.createTable(vesselEditorTableName, {
          userProfileId: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
          },
          vesselId: {
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

      let vesselGroupEditorTable;
      try {
        vesselGroupEditorTable = await queryInterface.describeTable(
          vesselGroupEditorTableName,
        );
      } catch (err) {
        vesselGroupEditorTable = null;
      }
      if (!vesselGroupEditorTable) {
        await queryInterface.createTable(vesselGroupEditorTableName, {
          groupId: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
          },
          vesselId: {
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
      // End of Vessel Editor & Group Editor

      // New User Table Columns
      const userTable = await queryInterface.describeTable(userTableName);
      await Promise.all(
        newUserColumns.map(async (col) => {
          if (!userTable[col.columnName]) {
            await queryInterface.addColumn(
              userTableName,
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
        }),
      );

      // End of New User Table Columns

      // New Calendar Event Columns
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
        }),
      );
      // End of Calendar Event Columns

      // User Shareable
      let userShareableInfoTable;
      try {
        userShareableInfoTable = await queryInterface.describeTable(
          userShareableInfoTableName,
        );
      } catch (err) {
        userShareableInfoTable = null;
      }
      if (!userShareableInfoTable) {
        await queryInterface.createTable(
          userShareableInfoTableName,
          {
            userId: {
              type: Sequelize.DataTypes.UUID,
              allowNull: false,
              primaryKey: true,
            },
            semergencyContactName: {
              type: Sequelize.DataTypes.STRING,
            },
            emergencyContactPhone: {
              type: Sequelize.DataTypes.STRING,
            },
            emergencyContactEmail: {
              type: Sequelize.DataTypes.STRING,
            },
            emergencyContactRelationship: {
              type: Sequelize.DataTypes.STRING,
            },
            foodAllergies: {
              type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING),
            },
            epirbBeaconHexId: {
              type: Sequelize.DataTypes.STRING,
            },
            certifications: {
              type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING),
            },
            medicalProblems: {
              type: Sequelize.DataTypes.STRING,
              comment: 'Contains array of string json, encrypted',
            },
            covidVaccinationCard: {
              type: Sequelize.DataTypes.STRING,
            },
            tShirtSize: {
              type: Sequelize.DataTypes.STRING,
            },
            passportNumber: {
              type: Sequelize.DataTypes.STRING,
            },
            passportIssueDate: {
              type: Sequelize.DataTypes.DATEONLY,
            },
            passportExpirationDate: {
              type: Sequelize.DataTypes.DATEONLY,
            },
            passportIssueCountry: {
              type: Sequelize.DataTypes.STRING,
            },
            passportPhoto: {
              type: Sequelize.DataTypes.STRING,
            },
          },
          {
            transaction,
          },
        );
      }
      // End of life raft table
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

      let vesselEditorTable;
      try {
        vesselEditorTable = await queryInterface.describeTable(
          vesselEditorTableName,
        );
      } catch (err) {
        vesselEditorTable = null;
      }
      if (!vesselEditorTable) {
        await queryInterface.dropTable(vesselEditorTableName, {
          transaction,
        });
      }

      let vesselGroupEditorTable;
      try {
        vesselGroupEditorTable = await queryInterface.describeTable(
          vesselGroupEditorTableName,
        );
      } catch (err) {
        vesselGroupEditorTable = null;
      }
      if (!vesselGroupEditorTable) {
        await queryInterface.dropTable(vesselGroupEditorTableName, {
          transaction,
        });
      }

      newUserColumns.map(async (col) => {
        await queryInterface.removeColumn(userTableName, col.columnName, {
          transaction,
        });
      });

      newCalendarEventColumns.map(async (col) => {
        await queryInterface.removeColumn(
          calendarEventTableName,
          col.columnName,
          {
            transaction,
          },
        );
      });

      let userShareableInfoTable;
      try {
        userShareableInfoTable = await queryInterface.describeTable(
          userShareableInfoTableName,
        );
      } catch (err) {
        userShareableInfoTable = null;
      }
      if (userShareableInfoTable) {
        await queryInterface.dropTable(userShareableInfoTableName, {
          transaction,
        });
      }
    });
  },
};
