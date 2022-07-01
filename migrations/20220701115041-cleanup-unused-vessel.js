'use strict';
const db = require('../index');

const tableName = 'Vessels';

module.exports = {
  up: async () => {
    console.log('cleaning up unused scoped vessels');
    const vessels = await db.Vessel.findAll({
      where: {
        scope: {
          [db.Op.ne]: null,
        },
      },
      raw: true,
      paranoid: false,
    });

    console.log('found', vessels.length, 'scoped vessels');

    const vps = await db.VesselParticipant.findAll({
      where: {
        vesselId: {
          [db.Op.in]: vessels.map((t) => t.isSoftDeleted),
        },
      },
      raw: true,
    });

    const tobeDeleted = vessels.filter(
      (t) => vps.findIndex((v) => v.vesselId === t.id) < 0,
    );

    console.log('found', tobeDeleted.length, 'vessels to be deleted');

    console.log('deleting', tobeDeleted.length, 'vessels');

    const deleted = await db.Vessel.destroy({
      where: {
        id: {
          [db.Op.in]: tobeDeleted.map((t) => t.id),
        },
      },
      force: true,
    });

    console.log('deleted :>> ', deleted, 'rows');
  },

  down: async (queryInterface, Sequelize) => {},
};
