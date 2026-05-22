const mongoose = require('mongoose');
const logger = require('./logger');

const createIndexes = async () => {
  try {
    const indexes = [
      { collection: 'users', indexes: [{ email: 1 }, { role: 1 }] },
      { collection: 'lawyers', indexes: [{ userId: 1 }, { city: 1 }, { rating: -1 }, { specializations: 1 }] },
      { collection: 'clients', indexes: [{ userId: 1 }] },
      { collection: 'cases', indexes: [{ client: 1 }, { lawyer: 1 }, { status: 1 }, { category: 1 }, { createdAt: -1 }] },
      { collection: 'offers', indexes: [{ case: 1 }, { lawyer: 1 }, { status: 1 }] },
      { collection: 'messages', indexes: [{ caseId: 1 }, { sender: 1 }, { recipient: 1 }] },
      { collection: 'notifications', indexes: [{ user: 1 }, { read: 1 }, { createdAt: -1 }] },
      { collection: 'reviews', indexes: [{ lawyer: 1 }, { case: 1 }] },
      { collection: 'invoices', indexes: [{ case: 1 }, { status: 1 }] },
      { collection: 'payouts', indexes: [{ lawyer: 1 }, { status: 1 }] },
      { collection: 'refresh-tokens', indexes: [{ token: 1 }, { user: 1 }, { expiresAt: 1 }] },
      { collection: 'categories', indexes: [{ name: 1 }] }
    ];

    for (const idx of indexes) {
      try {
        const collection = mongoose.connection.db.collection(idx.collection);
        await collection.createIndex(idx.indexes, { background: true });
        logger.info(`Created indexes for ${idx.collection}`);
      } catch (error) {
        logger.warn(`Index creation for ${idx.collection}:`, error.message);
      }
    }

    logger.info('Index creation completed');
  } catch (error) {
    logger.error('Index creation failed:', error);
  }
};

const optimizeQuery = (query, options = {}) => {
  const { lean = true, populate = [], select = '' } = options;

  let optimized = query;

  if (lean) {
    optimized = optimized.lean();
  }

  if (select) {
    optimized = optimized.select(select);
  }

  if (populate && populate.length > 0) {
    populate.forEach(p => {
      const [path, selectFields] = typeof p === 'string' ? [p] : [p.path, p.select];
      optimized = optimized.populate(path, selectFields);
    });
  }

  return optimized;
};

const batchProcess = async (items, batchSize = 100, processor) => {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
};

const aggregateWithPagination = async (model, pipeline, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await model.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];
  const data = await model.aggregate(dataPipeline);

  return {
    items: data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

class QueryOptimizer {
  constructor(model) {
    this.model = model;
  }

  lean() {
    return this.model.find().lean();
  }

  select(fields) {
    this.model = this.model.select(fields);
    return this;
  }

  populate(paths) {
    const populateArray = Array.isArray(paths) ? paths : [paths];
    populateArray.forEach(p => this.model = this.model.populate(p));
    return this;
  }

  exec() {
    return this.model.exec();
  }
}

const useLean = (query) => query.lean();

const avoidNPlusOne = async (model, items, foreignKey, populatePath, batchSize = 100) => {
  const ids = [...new Set(items.map(item => item[foreignKey]))];

  const results = await batchProcess(ids, batchSize, async (id) => {
    return model.findById(id).lean();
  });

  const lookup = new Map(results.map(r => [r._id.toString(), r]));

  return items.map(item => ({
    ...item,
    [populatePath]: lookup.get(item[foreignKey]?.toString())
  }));
};

const measurePerformance = async (name, fn) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();

  const result = await fn();

  const endMemory = process.memoryUsage();
  const duration = Date.now() - start;

  const memoryDelta = {
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    rss: endMemory.rss - startMemory.rss
  };

  logger.debug(`${name} performance`, {
    duration: `${duration}ms`,
    memory: {
      heapUsed: `${Math.round(memoryDelta.heapUsed / 1024)}KB`,
      rss: `${Math.round(memoryDelta.rss / 1024)}KB`
    }
  });

  return result;
};

module.exports = {
  createIndexes,
  optimizeQuery,
  batchProcess,
  aggregateWithPagination,
  QueryOptimizer,
  useLean,
  avoidNPlusOne,
  measurePerformance
};