const mongoose = require('mongoose');
const logger = require('./logger');

const startSession = async () => {
  return await mongoose.startSession();
};

const withTransaction = async (callback, options = {}) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    });

    return result;
  } catch (error) {
    logger.error('Transaction failed:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

const executeInTransaction = async (operations, session) => {
  const results = [];

  for (const operation of operations) {
    const result = await operation(session);
    results.push(result);
  }

  return results;
};

class TransactionManager {
  constructor() {
    this.session = null;
  }

  async start() {
    this.session = await mongoose.startSession();
    this.session.startTransaction();
    return this.session;
  }

  async commit() {
    if (this.session) {
      await this.session.commitTransaction();
    }
  }

  async abort() {
    if (this.session) {
      await this.session.abortTransaction();
    }
  }

  async end() {
    if (this.session) {
      await this.session.endSession();
      this.session = null;
    }
  }

  async run(callback) {
    try {
      await this.start();
      const result = await callback(this.session);
      await this.commit();
      return result;
    } catch (error) {
      await this.abort();
      throw error;
    } finally {
      await this.end();
    }
  }
}

module.exports = {
  startSession,
  withTransaction,
  executeInTransaction,
  TransactionManager
};