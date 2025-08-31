// FILE: sessionManager.js
'use strict';

const redis = require('redis');
const logger = require('../lib/logger.js');
const { promisify } = require('node:util');

class SessionManager {
  constructor({ accessTtl = 15 * 60, refreshTtl = 7 * 24 * 60 * 60 } = {}) {
    const {
      REDIS_URL,
      REDIS_HOST = '127.0.0.1',
      REDIS_PORT = '6379',
      REDIS_PASSWORD,
    } = process.env;
    if (REDIS_URL) {
      this.redis = redis.createClient(REDIS_URL);
    } else if (REDIS_PASSWORD) {
      this.redis = redis.createClient(Number(REDIS_PORT), REDIS_HOST, {
        password: REDIS_PASSWORD,
      });
    } else {
      this.redis = redis.createClient(Number(REDIS_PORT), REDIS_HOST);
    }
    this.accessTtl = accessTtl; // seconds
    this.refreshTtl = refreshTtl; // seconds

    // Promisified Redis v3 methods
    this.getAsync = promisify(this.redis.get).bind(this.redis);
    this.delAsync = promisify(this.redis.del).bind(this.redis);
    this.expireAsync = promisify(this.redis.expire).bind(this.redis);
    this.smembersAsync = promisify(this.redis.smembers).bind(this.redis);
    this.saddAsync = promisify(this.redis.sadd).bind(this.redis);
    this.sremAsync = promisify(this.redis.srem).bind(this.redis);
    this.incrAsync = promisify(this.redis.incr).bind(this.redis);
    this.decrAsync = promisify(this.redis.decr).bind(this.redis);
    this.quitAsync = promisify(this.redis.quit).bind(this.redis);

    this.metrics = {
      totalSessions: 0,
      activeSessions: 0,
      redisErrors: 0,
    };

    this.setupRedis();
  }

  setupRedis() {
    // Log Redis client properties for debugging
    console.log('Redis client properties:', {
      isReady: this.redis.isReady,
      isOpen: this.redis.isOpen,
      status: this.redis.status,
      connected: this.redis.connected,
      ready: this.redis.ready,
      hasConnect: typeof this.redis.connect === 'function',
    });

    this.redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
      this.metrics.redisErrors++;
    });

    this.redis.on('connect', () => {
      logger.system('Redis connected');
      console.log('Redis connect event fired');
    });

    this.redis.on('ready', () => {
      logger.system('Redis ready');
      console.log('Redis ready event fired');
    });

    // Redis v3 connects automatically, no need to call connect()
    // this.redis.connect().catch((err) => {
    //   logger.error('Failed to connect Redis:', err);
    //   console.error('Redis connect error:', err);
    // });
  }

  // Helper method to check if Redis is ready
  isRedisReady() {
    // Check multiple Redis ready states for compatibility
    // For Redis v3, isReady might be undefined, so we check status
    return (
      this.redis.isReady === true ||
      this.redis.isOpen === true ||
      this.redis.status === 'ready' ||
      this.redis.status === 'connected' ||
      this.redis.ready === true ||
      this.redis.connected === true
    );
  }

  // Execute a Redis v3 multi/transaction with Promise
  async execMulti(multi) {
    return new Promise((resolve, reject) => {
      multi.exec((err, replies) => {
        if (err) return reject(err);
        resolve(replies);
      });
    });
  }

  // create access session (short TTL). Use multi for atomicity.
  async createAccessSession(accessToken, data) {
    const sessionKey = `session:${accessToken}`;
    const idxKey = data.id ? `user_sessions:${data.id}` : null;
    const payload = {
      ...data,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.accessTtl * 1000).toISOString(),
      _source: 'redis',
    };

    try {
      if (this.isRedisReady()) {
        const multi = this.redis.multi();
        // Redis v3 command names are lowercase and use setex/sadd
        multi.setex(sessionKey, this.accessTtl, JSON.stringify(payload));
        if (idxKey) {
          multi.sadd(idxKey, accessToken);
          multi.expire(idxKey, this.accessTtl);
        }
        // keep a counter for analytics instead of KEYS
        multi.incr('metrics:activeSessions');
        await this.execMulti(multi);
      } else {
        throw new Error('Redis is not ready');
      }

      this.metrics.totalSessions++;
      this.metrics.activeSessions++;
      return payload;
    } catch (err) {
      logger.error('createAccessSession error', err);
      throw err;
    }
  }

  // create refresh token record by refreshHash (not raw token)
  async createRefreshTokenByHash(refreshHash, userId, meta = {}) {
    const key = `refresh:${refreshHash}`;
    const payload = { userId, createdAt: new Date().toISOString(), meta };
    try {
      if (this.isRedisReady()) {
        const multi = this.redis.multi();
        multi.setex(key, this.refreshTtl, JSON.stringify(payload));
        multi.sadd(`user_refreshs:${userId}`, refreshHash);
        multi.expire(`user_refreshs:${userId}`, this.refreshTtl);
        await this.execMulti(multi);
      }
      return payload;
    } catch (err) {
      logger.error('createRefreshTokenByHash error', err);
      return payload;
    }
  }

  // Get access session by token
  async getAccessSession(accessToken) {
    try {
      if (this.isRedisReady()) {
        const raw = await this.getAsync(`session:${accessToken}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          // expired?
          if (
            parsed.expiresAt &&
            new Date(parsed.expiresAt).getTime() < Date.now()
          ) {
            await this.invalidateAccessSession(accessToken);
            return null;
          }
          // extend TTL sliding
          await this.expireAsync(`session:${accessToken}`, this.accessTtl);
          if (parsed.id)
            await this.expireAsync(
              `user_sessions:${parsed.id}`,
              this.accessTtl,
            );
          return parsed;
        }
      }
      return null;
    } catch (err) {
      logger.error('getAccessSession error', err);
      return null;
    }
  }

  // get refresh by raw token (we store hashed)
  async getRefreshByRaw(refreshRaw) {
    try {
      if (!this.isRedisReady()) return null;
      const toBase64 = (val) => {
        let s = typeof val === 'string' ? val : String(val || '');
        if (s.includes('%')) s = decodeURIComponent(s);
        s = s.replace(/ /g, '+');
        s = s.replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4 !== 0) s += '=';
        return s;
      };
      const { hashTokenHex } = require('../lib/common');
      const normalized = toBase64(refreshRaw);
      const candidates = new Set([String(refreshRaw || ''), normalized]);
      for (const candidate of candidates) {
        const h = hashTokenHex(candidate);
        const raw = await this.getAsync(`refresh:${h}`);
        if (raw) return { data: JSON.parse(raw), refreshHash: h };
      }
      return null;
    } catch (err) {
      logger.error('getRefreshByRaw error', err);
      return null;
    }
  }

  // Invalidate access
  async invalidateAccessSession(accessToken) {
    try {
      let userId = null;
      if (this.isRedisReady()) {
        const raw = await this.getAsync(`session:${accessToken}`);
        if (raw) {
          try {
            userId = JSON.parse(raw).id;
          } catch (e) {}
        }
      }

      if (this.isRedisReady()) {
        const multi = this.redis.multi();
        multi.del(`session:${accessToken}`);
        if (userId) multi.srem(`user_sessions:${userId}`, accessToken);
        multi.decr('metrics:activeSessions');
        await this.execMulti(multi);
      }
      this.metrics.activeSessions = Math.max(
        0,
        this.metrics.activeSessions - 1,
      );
      return true;
    } catch (err) {
      logger.error('invalidateAccessSession error', err);
      return false;
    }
  }

  // Invalidate refresh by raw or by hash
  async invalidateRefreshByRaw(refreshRaw) {
    try {
      if (!this.isRedisReady()) return false;
      const { hashTokenHex } = require('../lib/common');
      const refreshHash = hashTokenHex(refreshRaw);
      const raw = await this.getAsync(`refresh:${refreshHash}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const userId = parsed.userId;
      const multi = this.redis.multi();
      multi.del(`refresh:${refreshHash}`);
      if (userId) multi.srem(`user_refreshs:${userId}`, refreshHash);
      await this.execMulti(multi);
      return true;
    } catch (err) {
      logger.error('invalidateRefreshByRaw error', err);
      return false;
    }
  }

  // Invalidate all sessions for user (both access and refresh)
  async invalidateAllUserSessions(userId) {
    try {
      if (this.isRedisReady()) {
        const sKey = `user_sessions:${userId}`;
        const rKey = `user_refreshs:${userId}`;
        const accessTokens = await this.smembersAsync(sKey);
        if (accessTokens && accessTokens.length) {
          const keys = accessTokens.map((t) => `session:${t}`);
          const multi = this.redis.multi();
          for (const k of keys) multi.del(k);
          multi.del(sKey);
          await this.execMulti(multi);
        }
        const refreshHashes = await this.smembersAsync(rKey);
        if (refreshHashes && refreshHashes.length) {
          const rkeys = refreshHashes.map((h) => `refresh:${h}`);
          const multi2 = this.redis.multi();
          for (const k of rkeys) multi2.del(k);
          multi2.del(rKey);
          await this.execMulti(multi2);
        }
      }
      return true;
    } catch (err) {
      logger.error('invalidateAllUserSessions error', err);
      return false;
    }
  }

  async close() {
    try {
      if (this.isRedisReady()) await this.quitAsync();
    } catch (err) {
      logger.error('SessionManager close error', err);
    }
  }
}

module.exports = { SessionManager };
