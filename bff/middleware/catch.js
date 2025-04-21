const { LRUCache } = require('lru-cache');
const Redis = require('ioredis');

// 创建缓存存储实例
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

// 内存缓存
class MemoryStore {
  constructor(options = {
    max: 100, // 最大缓存数量
    ttl: 1000 * 60 * 5 // 缓存过期时间，单位为毫秒，设置为 5 分钟，一般来说上层的时间越短
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

// Redis 缓存
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
  async set(key, value) {
    await this.client.set(key, JSON.stringify(value));
    await this.client.expire(key, 60 * 10); // 缓存过期时间，单位为秒，这里设置为 10 分钟
  }
}

const cacheMiddleware = (options ={}) => {
  return  async (req, res, next) => {
    // 创建缓存存储实例
    const cacheStore = new CacheStore();
    // 添加内存缓存
    cacheStore.add(new MemoryStore());
    // 添加 Redis 缓存
    const redisStore = new RedisStore(options);
    cacheStore.add(redisStore);
    // 将缓存存储实例添加到响应对象中
    res.cache = cacheStore;
    await next();
  }
};

module.exports = cacheMiddleware;