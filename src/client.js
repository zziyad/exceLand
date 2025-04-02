'use strict';

const jwt = require('jsonwebtoken');
const { metarhia } = require('./dependencies.js');
const { redisSet, redisGet, redisDel } = require('../lib/common.js');
const { Context } = require('./context.js');

class Client {
  #transport;

  constructor(transport, logger, config) {
    this.#transport = transport;
    this.ip = transport.ip;
    this.logger = logger;
    this.config = config;
    this.session = null;
  }

  createContext() {
    return new Context(this);
  }

  getCookies() {
    const { cookie } = this.#transport.req.headers;
    if (!cookie) return null;
    const { token } = metarhia.metautil.parseCookies(cookie);
    return token;
  }

  async startSession(token, data = {}) {
    // this.session = { token, state: { ...data } };
    // await redisSet(
    //   token,
    //   this.config.sessions.expiry || 360000,
    //   JSON.stringify(this.session),
    // );
    if (!this.#transport.connection) this.#transport.sendSessionCookie(token);
    return true;
  }

  async restoreSession(token) {
    if (!token) return false;
    const session = await redisGet(token);
    if (!session) return false;
    this.session = JSON.parse(session);
    const decoded = await this.decrypt(token);
    if (!decoded) return false;
    return true;
  }

  removeSession() {
    const token = this.getCookies();
    // console.log({ ses: this.session });
    this.#transport.removeSessionCookie(token);
  }

  async finalizeSession() {
    if (!this.session) return false;
    await redisDel(this.session.token);
    this.session = null;
    return true;
  }

  async encrypt(payload) {
    return jwt.sign(
      { ...payload, iat: Math.floor(Date.now() / 1000) },
      this.config.sessions.secret,
      { expiresIn: this.config.sessions.expiry || '1m' },
    );
  }

  async decrypt(token) {
    try {
      return jwt.verify(token, this.config.sessions.secret);
    } catch (error) {
      this.logger.error('Failed to verify session:', error.message);
      if (error.name === 'TokenExpiredError') throw new Error('jwt expired');
      if (error.name === 'JsonWebTokenError') throw new Error('invalid token');
      throw error;
    }
  }

  async authenticate(token) {
    if (!token) throw new Error('No token provided');
    const decoded = await this.decrypt(token);
    this.#transport.req.user = decoded;
    return true;
  }

  async authorize(roles) {
    if (!roles.includes(this.#transport.req.user?.role)) {
      throw new Error('Forbidden');
    }
  }

  error(code, options) {
    this.#transport.error(code, options);
  }

  send(data) {
    this.#transport.send(data);
  }
}

module.exports = { Client };
