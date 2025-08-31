'use strict';

const https = require('node:https');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const ws = require('ws');
const { receiveBody, jsonParse } = require('../lib/common.js');
const transport = require('./transport.js');
const { HttpTransport, WsTransport, MIME_TYPES, HEADERS } = transport;
const { SessionManager } = require('./sessionManager.js');

// Initialize session manager
const sessionManager = new SessionManager();

const ACCESS_TTL = sessionManager.accessTtl;
const REFRESH_TTL = sessionManager.refreshTtl;

class Session {
  constructor(token, data) {
    this.token = token;
    this.state = { ...data };
  }
}

class Context {
  constructor(client) {
    this.client = client;
    this.uuid = crypto.randomUUID();
    this.state = {};
    // this.session = client.session || null;
  }
  get session() {
    return this.client.session;
  }
}

class Client extends EventEmitter {
  #transport;

  constructor(transport) {
    super();
    this.#transport = transport;
    this.ip = transport.ip;
    this.session = null;
  }

  error(code, options) {
    this.#transport.error(code, options);
  }

  send(obj, code) {
    this.#transport.send(obj, code);
  }

  clearSessionCookies() {
    if (this.#transport && typeof this.#transport.clearSessionCookies === 'function') {
      this.#transport.clearSessionCookies();
    }
  }

  async invalidateAccessSession(token) {
    try {
      if (!token) return false;
      return await sessionManager.invalidateAccessSession(token);
    } catch {
      return false;
    }
  }

  createContext() {
    return new Context(this);
  }

  emit(name, data) {
    if (name === 'close') {
      super.emit(name, data);
      return;
    }
    this.send({ type: 'event', name, data });
  }

  // New middleware method for token validation
  async validateAccessToken(accessToken) {
    if (!accessToken) return null;

    try {
      // Verify token signature first
      const { verifySignedToken } = require('../lib/common.js');
      const appConfig = this.#transport?.server?.application?.config;
      const secret = appConfig?.sessions?.secret;
      if (!secret) {
        console.warn('Session secret is not configured');
        return null;
      }
      const randomBuf = verifySignedToken(secret, accessToken);

      if (!randomBuf) {
        console.log('Invalid token signature');
        return null;
      }

      // Get session from Redis/memory
      const sessionData = await sessionManager.getAccessSession(accessToken);
      if (!sessionData) {
        console.log('Session not found or expired');
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  // Public method to get cookies from transport
  getCookies() {
    return this.#transport.getCookies();
  }

  // Header proxies
  getHeader(name) {
    return this.#transport.getHeader(name);
  }

  getOrigin() {
    return this.#transport.getOrigin?.();
  }

  getReferrer() {
    return this.#transport.getReferrer?.();
  }

  getUserAgent() {
    return this.#transport.getUserAgent?.();
  }

  getRequestMeta() {
    return { ip: this.ip, userAgent: this.getUserAgent() };
  }

  // Rate limit proxy to sessionManager
  checkSlidingLimit(scope, dimension, id, windowSec, limit) {
    return sessionManager.checkSlidingLimit(scope, dimension, id, windowSec, limit);
  }

  async startSession(accessToken, refreshHash, refreshRaw, data = {}, options = {}) {
    try {
      // console.log(`Starting session for token: ${accessToken}`);
      // await this.initializeSession(accessToken, data);
      await sessionManager.createAccessSession(accessToken, data);
      // Store refresh mapped to user id
      const { hashTokenHex } = require('../lib/common.js');
      const ua = this.getUserAgent() || '';
      const uaHash = hashTokenHex(ua);
      const meta = {
        createdBy: options.createdBy || 'login',
        ip: this.ip,
        uaHash,
      };
      await sessionManager.createRefreshTokenByHash(refreshHash, data.id, meta);

      this.session = new Session(accessToken, data);

      if (!this.#transport.connection) {
        console.log('Sending session cookie');
        this.#transport.sendSessionCookie(
          accessToken,
          refreshRaw,
          ACCESS_TTL,
          REFRESH_TTL,
        );
      }
      // console.log(`Session started successfully for token: ${token}`);
      // console.log('Session data stored:', this.session.state);
      return true;
    } catch (error) {
      console.error('Session start error:', error);
      // // Fallback to memory-only session
      // this.session = new Session(token, data, this.#transport.server);
      // if (!this.#transport.connection)
      //   this.#transport.sendSessionCookie(token, data.sessionId);
      return false;
    }
  }

  getRefreshByRaw(refreshRaw) {
    return sessionManager.getRefreshByRaw(refreshRaw);
  }

  invalidateRefreshByRaw(refreshRaw) {
    return sessionManager.invalidateRefreshByRaw(refreshRaw);
  }

  invalidateAccessSession(accessToken) {
    return sessionManager.invalidateAccessSession(accessToken);
  }

  checkSlidingLimit(key, type, value, ttl, max) {
    return sessionManager.checkSlidingLimit(key, type, value, ttl, max);
  }

  destroy() {
    this.emit('close');
    this.session = null;
  }
}

class Server {
  constructor(application) {
    this.application = application;
    const { console, routing, config } = application;
    // const staticPath = path.join(application.path, './static');
    // this.staticHandler = serveStatic(staticPath);
    this.routing = routing;
    this.console = console;

    // SSL options for HTTPS
    const sslOptions = this.getSSLOptions();

    if (sslOptions) {
      this.httpServer = https.createServer(sslOptions);
      this.isHttps = true;
      this.console.log('HTTPS server created with SSL certificates');
    } else {
      console.log('No SSL certificates found');
      this.httpServer = http.createServer();
      this.isHttps = false;
      this.console.log('HTTP server created (no SSL certificates found)');
    }

    const [port] = config.server.ports;
    // Guard: ensure session secret is configured
    if (!config?.sessions?.secret) {
      this.console.warn('Session secret is not configured. Access tokens cannot be validated.');
    }
    this.listen(port);
    this.console.log(`API on port ${port} (${sslOptions ? 'HTTPS' : 'HTTP'})`);
  }

  getSSLOptions() {
    try {
      const tls = this.application?.config?.server?.tls;
      if (tls?.enabled && tls.certPath && tls.keyPath) {
        if (fs.existsSync(tls.certPath) && fs.existsSync(tls.keyPath)) {
          return {
            cert: fs.readFileSync(tls.certPath),
            key: fs.readFileSync(tls.keyPath),
          };
        }
      }
      // Fallback to dev paths if present
      const devCertPath = path.join(process.cwd(), 'certs-old', 'cert.pem');
      const devKeyPath = path.join(process.cwd(), 'certs-old', 'key.pem');
      if (fs.existsSync(devCertPath) && fs.existsSync(devKeyPath)) {
        return {
          cert: fs.readFileSync(devCertPath),
          key: fs.readFileSync(devKeyPath),
        };
      }
      return null;
    } catch (error) {
      console.warn('SSL certificate loading failed:', error.message);
      return null;
    }
  }

  listen(port) {
    this.httpServer.on('request', async (req, res) => {
      const transport = new HttpTransport(this, req, res);
      if (!req.url.startsWith('/api'))
        return void this.application.static.serve(req.url, transport);

      // Handle CORS preflight: HttpTransport already responded
      if (req.method === 'OPTIONS') return;

      const client = new Client(transport);
      const data = await receiveBody(req);
      this.rpc(client, data);
      // For HTTP requests, destroy client after response is sent
      req.on('close', () => {
        // Only destroy if no active session or if session is already stored in Redis
        if (!client.session) {
          client.destroy();
        } else {
          console.log(
            `Preserving session for HTTP client: ${client.session.token}`,
          );
          // Don't destroy - let the session manager handle cleanup
        }
      });
    });

    const wsServer = new ws.Server({ server: this.httpServer });
    wsServer.on('connection', (connection, req) => {
      const transport = new WsTransport(this, req, connection);
      const client = new Client(transport);

      connection.on('message', (data) => {
        this.rpc(client, data);
      });

      connection.on('close', () => {
        client.destroy();
      });
    });

    this.httpServer.listen(port);
  }

  async rpc(client, data) {
    const packet = jsonParse(data);
    if (!packet) {
      const error = new Error('JSON parsing error');
      client.error(500, { error, pass: true });
      return;
    }
    // CSRF hardening: require allowed Origin/Referer and X-Requested-With
    const origin = client.getOrigin?.();
    const referer = client.getReferrer?.();
    const xrw = client.getHeader?.('x-requested-with');
    const allowed = this.application?.config?.server?.cors?.allowedOrigins || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
    const allowedSet = new Set(allowed);
    const extractOrigin = (url) => {
      try {
        const u = new URL(url);
        return `${u.protocol}//${u.host}`;
      } catch {
        return null;
      }
    };
    if (origin && !allowedSet.has(origin)) {
      client.error(403, { error: { message: 'Forbidden origin' }, httpCode: 403 });
      return;
    }
    if (!origin && referer) {
      const refOrigin = extractOrigin(referer);
      if (refOrigin && !allowedSet.has(refOrigin)) {
        client.error(403, { error: { message: 'Forbidden referer' }, httpCode: 403 });
        return;
      }
    }
    if (xrw !== 'XMLHttpRequest') {
      client.error(403, { error: { message: 'X-Requested-With required' }, httpCode: 403 });
      return;
    }
    const { id, type, args } = packet;
    if (type !== 'call' || !id || !args) {
      const error = new Error('Packet structure error');
      client.error(400, { id, error, pass: true });
      return;
    }
    /* TODO: resumeCookieSession(); */
    const [unit, method] = packet.method.split('/');
    const proc = this.routing.get(unit + '.' + method);
    if (!proc) {
      client.error(404, { id });
      return;
    }
    const context = client.createContext();
    // expose app-level singletons in context
    context.sessionManager = sessionManager;
    context.config = this.application.config;

    // Debug context information can be added here if needed

    // Run authentication middleware for protected endpoints
    if (proc().access !== 'public') {
      try {
        // Get auth token from cookies
        const cookies = client.getCookies();
        const accessToken = cookies['auth-token'];

        if (!accessToken) {
          client.error(401, {
            id,
            error: { message: 'Authentication required' },
          });
          return;
        }

        // Validate token and get session data
        const sessionData = await client.validateAccessToken(accessToken);
        if (!sessionData) {
          client.error(401, {
            id,
            error: { message: 'Invalid or expired token' },
          });
          return;
        }

        // Set session in client
        client.session = new Session(accessToken, sessionData);
        this.console.log(`Auth OK ${client.ip}\tuser=${sessionData.id}`);
      } catch (error) {
        console.error('Auth check error:', error);
        client.error(500, { id, error: { message: 'Authentication error' } });
        return;
      }
    }

    this.console.log(`${client.ip}\t${packet.method}`);
    proc(context)
      .method(packet.args)
      .then((result) => {
        if (result?.constructor?.name === 'Error') {
          const { code, httpCode = 200 } = result;
          client.error(code, { id, error: result, httpCode });
          return;
        }
        client.send({ type: 'callback', id, result });
      })
      .catch((error) => {
        client.error(error.code, { id, error });
      });
  }
}

module.exports = { Server };
