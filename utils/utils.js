const db = require('../index');

const BaseError = require('./BaseError');
const ValidationError = require('./ValidationError');
const { Transaction } = require('sequelize');
const turf = require('@turf/turf');

exports.includeMeta = [
  {
    model: db.UserProfile,
    as: 'createdBy',
    attributes: ['id', 'name'],
  },
  {
    model: db.UserProfile,
    as: 'updatedBy',
    attributes: ['id', 'name'],
  },
];

exports.ValidationError = ValidationError;

exports.BaseError = BaseError;

exports.setCreateMeta = (data = {}, user) => {
  const now = Date.now();

  data.createdById = user?.id;
  data.developerId = user?.developerId;
  data.createdAt = now;

  return data;
};

exports.setUpdateMeta = (data = {}, user) => {
  const now = Date.now();

  data.updatedById = user?.id;
  data.updatedAt = now;

  return data;
};

exports.getMeta = ({ updatedById, updatedAt, createdById, createdAt } = {}) => {
  return {
    updatedById,
    updatedAt,
    createdById,
    createdAt,
  };
};

exports.validateSqlDataAuth = ({ editors = [], ownerId = '' } = {}, userId) => {
  let result = {
    isOwner: false,
    isEditor: false,
  };

  if (Array.isArray(editors) && editors.length > 0) {
    const idIndex = editors.findIndex((t) => t.id === userId);
    result.isEditor = idIndex > -1;
  }

  result.isOwner = ownerId === userId;

  return result;
};

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 *
 */

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const callBackType = (req, res, next) => { };

/**
 * @param {callBackType} fn
 */
exports.asyncHandler = (fn) =>
  function (...args) {
    const fnReturn = fn(...args);
    const next = args[args.length - 1];
    return Promise.resolve(fnReturn).catch(next);
  };

exports.includeMeta = [
  {
    model: db.UserProfile,
    as: 'createdBy',
    attributes: ['id', 'name'],
  },
  {
    model: db.UserProfile,
    as: 'updatedBy',
    attributes: ['id', 'name'],
  },
];

// 5 minutes default buffer
exports.getRaceTimeBuffer = (time, buffer = 60000) => {
  if (isNaN(time?.getTime())) return null;

  return {
    start: time,
    end: new Date(time.getTime() + buffer),
  };
};

/**
 * Create transaction for syrf database
 * @returns {Transaction} Sequelize Transaction
 */
exports.createTransaction = async () => {
  return await db.sequelize.transaction();
}

exports.useTransaction =
  (fc) =>
    async (...args) => {
      if (args.length > 0 && args[args.length - 1] instanceof Transaction) {
        return await fc(...args);
      } else {
        const tran = await db.sequelize.transaction();
        try {
          const result = await fc(...[...args, tran]);
          await tran.commit();
          return result;
        } catch (error) {
          await tran.rollback();
          throw error;
        }
      }
    };

exports.getCourseCenterPoint = (geometries = []) => {
  if (geometries.length < 1) return null;

  let centerPoint = null;

  let { geometryType, coordinates } = geometries[0];
  coordinates = coordinates.map((t) => (!Array.isArray(t) ? t.position : t)); //adjust coordinates to use array

  // CourseSequencedGeometry created on LDS has different structure from geojson.io (and turf formatting),
  // such as: Point is nested in another array, also simple line is treated as polyline
  // Below implementation is based on LDS format
  switch (String(geometryType).toLowerCase()) {
    case 'line':
      centerPoint = turf.midpoint(
        coordinates[0],
        coordinates[coordinates.length - 1],
      ).geometry.coordinates;
      break;
    case 'polyline':
      centerPoint = turf.midpoint(
        coordinates[0],
        coordinates[coordinates.length - 1],
      ).geometry.coordinates;
      break;
    case 'polygon':
      centerPoint = turf.centroid(turf.helpers.multiPoint(coordinates)).geometry
        .coordinates;
      break;
    case 'point':
      centerPoint = coordinates[0]; // Note: Based on the data found on our DB, point structure is different from geojson.io representation
      break;
    default:
      centerPoint = null;
      break;
  }

  return centerPoint;
};
