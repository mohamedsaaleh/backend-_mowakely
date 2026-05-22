const constants = require('../constants');
const { escapeRegex } = require('./escapeRegex');

class QueryBuilder {
  constructor(model) {
    this.model = model;
    this.query = {};
    this.sort = {};
    this.populate = [];
    this.select = '';
    this.lean = true;
  }

  filter(filters) {
    if (!filters || typeof filters !== 'object') return this;

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (key === 'search') {
          const searchValue = escapeRegex(filters[key]);
          this.query.$or = [
            { title: { $regex: searchValue, $options: 'i' } },
            { description: { $regex: searchValue, $options: 'i' } },
            { name: { $regex: searchValue, $options: 'i' } },
            { fullName: { $regex: searchValue, $options: 'i' } }
          ];
        } else if (Array.isArray(filters[key])) {
          this.query[key] = { $in: filters[key] };
        } else if (typeof filters[key] === 'object') {
          this.query[key] = filters[key];
        } else {
          this.query[key] = filters[key];
        }
      }
    });

    return this;
  }

  sortBy(sortField) {
    if (!sortField) return this;

    const sortOrder = sortField.startsWith('-') ? -1 : 1;
    const field = sortField.replace(/^-/, '');

    const allowedFields = ['createdAt', 'updatedAt', 'name', 'fullName', 'rating', 'budget', 'price'];
    if (allowedFields.includes(field)) {
      this.sort[field] = sortOrder;
    }

    return this;
  }

  selectFields(fields) {
    if (!fields) return this;
    this.select = fields.split(' ').join(' ');
    return this;
  }

  withPagination(page = constants.PAGINATION.DEFAULT_PAGE, limit = constants.PAGINATION.DEFAULT_LIMIT) {
    this.page = parseInt(page);
    this.limit = parseInt(limit);
    this.skip = (this.page - 1) * this.limit;
    return this;
  }

  populateFields(fields) {
    if (!fields) return this;

    const populateArray = Array.isArray(fields) ? fields : fields.split(',');

    populateArray.forEach(field => {
      const [path, select] = field.trim().split(':');
      const populateObj = { path };

      if (select) {
        populateObj.select = select.replace(/,/g, ' ');
      }

      this.populate.push(populateObj);
    });

    return this;
  }

  async execute() {
    let query = this.model.find(this.query);

    if (this.populate.length > 0) {
      this.populate.forEach(p => query = query.populate(p));
    }

    if (this.select) {
      query = query.select(this.select);
    }

    if (this.sort && Object.keys(this.sort).length > 0) {
      query = query.sort(this.sort);
    }

    if (this.lean) {
      query = query.lean();
    }

    if (this.skip !== undefined && this.limit) {
      const total = await this.model.countDocuments(this.query);

      query = query.skip(this.skip).limit(this.limit);

      const data = await query;

      return {
        items: data,
        pagination: {
          total,
          page: this.page,
          limit: this.limit,
          pages: Math.ceil(total / this.limit),
          hasNext: this.page < Math.ceil(total / this.limit),
          hasPrev: this.page > 1
        }
      };
    }

    return query.exec();
  }
}

module.exports = QueryBuilder;
