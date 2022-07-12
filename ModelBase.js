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
   * @returns {import('./types/pagination').PaginationResponse<ModelBase>}
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
      customCountField = null,
      defaultSort = null,
    } = {},
  ) {
    customCountField = customCountField || `"${this.name}"."id"`;
    let pagingSize = Math.max(size, 1);
    let pageQuery = Math.max(page, 1);
    let srdirQuery = srdir;

    const filtersRelatedSort = [];

    if (srdirQuery) {
      srdirQuery = srdirQuery < 0 ? 'DESC' : 'ASC';
    } else {
      srdirQuery = 'ASC';
    }

    let conditions = [];

    if (attribute?.where) {
      conditions.push(attribute?.where);
    }

    filters.forEach((filter) => {
      if (!filter.field) return;
      if (filter.isCustom) {
        conditions.push(filter.query);
        if (filter.order?.length > 0) {
          filtersRelatedSort.push(...filter.order);
        }
        return;
      }

      let condition = null;
      let filterValue = filter.value;
      const field = filter.isNested ? `$${filter.field}$` : filter.field;

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
        case 'in':
          condition = Op.in;
          break;

        default:
          break;
      }
      if (condition)
        conditions.push({
          [field]: {
            [condition]: filterValue,
          },
        });
    });

    let order = null;
    let defaultSortUsed = false;
    switch (true) {
      case Array.isArray(customSort):
        order = customSort;
        break;
      case multiSort?.length > 0:
        order = multiSort;
        break;
      case !!sort:
        order = sort?.custom ? [sort.custom] : [[sort, srdirQuery]];
        break;
      case defaultSort?.length > 0:
        order = defaultSort;
        defaultSortUsed = true;
        break;
      default:
        order = [['updatedAt', 'DESC']];
        defaultSortUsed = true;
        break;
    }

    let params = {
      limit: pagingSize,
      offset: pagingSize * (pageQuery - 1),
      ...attribute,
      order: [...filtersRelatedSort, ...order],
    };

    if (filters.length > 0) params.where = { [Op.and]: conditions };

    let [result, count] = await Promise.all([
      this.findAll(params),
      this.count({
        ...params,
        attributes: [
          [literal(`COUNT(DISTINCT(${customCountField}))`), 'count'],
        ],
      }),
    ]);

    return {
      count,
      rows: result,
      page,
      size: pagingSize,
      sort: defaultSortUsed ? 'default' : sort,
      srdir: defaultSortUsed ? null : srdirQuery,
      q: query,
      draw: draw,
      filters: filters.map((t) => ({
        ...t,
        query: undefined,
        order: undefined,
        isCustom: undefined,
      })),
      multiSort,
    };
  }
}

module.exports = ModelBase;
