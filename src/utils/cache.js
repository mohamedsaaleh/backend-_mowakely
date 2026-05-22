const Redis = require('ioredis');
const config = require('../config/env');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  init() {
    if (process.env.NODE_ENV === 'test') {
      this.isConnected = false;
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 5000
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        if (process.env.NODE_ENV !== 'test') {
          logger.debug('Redis cache error:', err.message);
        }
      });

      this.client.connect().catch(() => {
        if (process.env.NODE_ENV !== 'test') {
          logger.debug('Redis connection failed, caching disabled');
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        logger.debug('Redis initialization failed, caching disabled');
      }
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) return false;

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error.message);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.isConnected || !this.client) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error.message);
      return false;
    }
  }

  async invalidatePrefix(prefix) {
    return this.delPattern(`${prefix}*`);
  }

  async getOrSet(key, callback, ttl = 3600) {
    const cached = await this.get(key);
    if (cached) return cached;

    const fresh = await callback();
    if (fresh) {
      await this.set(key, fresh, ttl);
    }
    return fresh;
  }

  async healthCheck() {
    if (!this.isConnected || !this.client) {
      return { status: 'disconnected' };
    }

    try {
      await this.client.ping();
      return { status: 'connected' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

const cache = new CacheManager();

const cacheMiddleware = (prefix, ttl = 3600) => {
  return async (req, res, next) => {
    if (config.nodeEnv === 'test') return next();

    const key = `${prefix}:${req.originalUrl}`;

    try {
      const cached = await cache.get(key);
      if (cached) {
        return res.status(200).json({
          success: true,
          message: 'From cache',
          data: cached.data,
          cached: true
        });
      }

      const originalJson = res.json.bind(res);

      res.json = (body) => {
        if (body.success && body.data) {
          cache.set(key, body, ttl).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

module.exports = { cache, cacheMiddleware, CacheManager };