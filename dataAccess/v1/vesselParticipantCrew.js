const db = require('../../index');

exports.bulkCreateWithOptions = async (data, options) => {
  if (data.length === 0) {
    return [];
  }
  const result = await db.VesselParticipantCrew.bulkCreate(data, options);
  return result;
};
