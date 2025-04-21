const { LRUCache } = require('lru-cache');
const Redis = require('ioredis');

class CacheStore {
  constructor(options) {
    this.stores = [];
  }
  add(store) {
    this.stores.push(store);
    return this;
  }
  async get(key) {
    for (const store of this.stores) {
      const value = await store.get(key);
      if (value) {
        return value;
      }
    }
  }
  async set(key, value) {
    for (const store of this.stores) {
      await store.set(key, value);
    }
  }
}

class MemoryStore {
  constructor(options = {
    max: 100,
    ttl: 1000 * 60 * 60 * 24
  }) {
    this.cache = new LRUCache(options);
  }
  async get(key) {
    return await this.cache.get(key);
  }
  async set(key, value, ttl) {
    await this.cache.set(key, value, ttl);
  }
}

class RedisStore {
  constructor(options = {
    host: '127.0.0.1',
    port: 6379,
    db: 'bff',
    password: null,
    keyPrefix: ''
  }) {
    this.client = new Redis(options);
  }
  async get(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : undefined;
  }
  async set(key, value, ttl) {
    await this.client.set(key, JSON.stringify(value));
  }
}

const cacheMiddleware = (options ={}) => {
  return  async (req, res, next) => {
    const cacheStore = new CacheStore();
    cacheStore.add(new MemoryStore());
    const redisStore = new RedisStore(options);
    cacheStore.add(redisStore);
    res.cache = cacheStore;
    await next();
  }
};

module.exports = cacheMiddleware;