/**
 * @typedef {import('sequelize').FindOptions} FindOptions
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('./index')} Models
 */

const { Model, Op, literal } = require('sequelize');

class ModelBase extends Model {
  static associateBase(models) {
    this.belongsTo(models.UserProfile, {
      as: 'createdBy',
      foreignKey: 'createdById',
      constraints: false,
    });
    this.belongsTo(models.UserProfile, {
      as: 'updatedBy',
      foreignKey: 'updatedById',
      constraints: false,
    });
    this.belongsTo(models.Developer, {
      as: 'developer',
      foreignKey: 'developerId',
      constraints: false,
    });
  }

  static associate() {}

  /**
   * @param {FindOptions} attribute
   * @param {import('./types/pagination').PaginationRequest} paging
   * @returns {import('./types/pagination').PaginationResponse<any>}
   */
  static async findAllWithPaging(
    attribute = {},
    {
      size,
      page,
      sort,
      srdir,
      customSort,
      query,
      draw,
      filters = [],
      multiSort = [],
    } = {},
  ) {
    let pagingSize = Math.max(size, 1);
    let pageQuery = Math.max(page, 1);
    let sortQuery = sort;
    let srdirQuery = srdir;

    if (!sortQuery) sortQuery = 'updatedAt'; //default sort by latest update

    if (srdirQuery) {
      srdirQuery = srdirQuery < 0 ? 'DESC' : 'ASC';
    } else {
      srdirQuery = 'DESC';
    }

    let conditions = [];

    if (attribute?.where) {
      conditions.push(attribute?.where);
    }

    filters.forEach((filter) => {
      if (!filter.field) return;

      let condition = null;
      let filterValue = filter.value;

      switch (filter.opr) {
        case 'gte':
          condition = Op.gte;
          break;
        case 'lte':
          condition = Op.lte;
          break;
        case 'gt':
          condition = Op.gt;
          break;
        case 'lt':
          condition = Op.lt;
          break;
        case 'eq':
          condition = Op.eq;
          break;
        case 'ne':
          condition = Op.ne;
          break;
        case 'contains':
          condition = Op.iLike;
          filterValue = `%${filterValue}%`;
          break;

        default:
          break;
      }
      if (condition)
        conditions.push({
          [filter.field]: {
            [condition]: filterValue,
          },
        });
    });

    let paginationSorts = [[sortQuery, srdirQuery]];
    if (multiSort?.length > 0) paginationSorts = multiSort;

    let params = {
      limit: pagingSize,
      offset: pagingSize * (pageQuery - 1),
      ...attribute,
      order: Array.isArray(customSort)
        ? [...customSort, ...paginationSorts]
        : paginationSorts,
    };

    if (filters.length > 0) params.where = { [Op.and]: conditions };

    let [result, count] = await Promise.all([
      this.findAll(params),
      this.count({
        ...params,
        attributes: [
          [literal(`COUNT(DISTINCT("${this.name}"."id"))`), 'count'],
        ],
      }),
    ]);

    return {
      count,
      rows: result.map((t) => t.toJSON()),
      page,
      size: pagingSize,
      sort: sortQuery,
      srdir: srdirQuery,
      q: query,
      draw: draw,
      filters,
      multiSort,
    };
  }
}

module.exports = ModelBase;
