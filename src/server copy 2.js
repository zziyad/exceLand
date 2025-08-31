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

const sessions = new Map(); // token: Session

class Context {
  constructor(client) {
    this.client = client;
    this.uuid = crypto.randomUUID();
    this.state = {};
    this.session = client?.session || null;
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

  initializeSession(token, data = {}) {
    this.finalizeSession();
    this.session = new Session(token, data);
    sessions.set(token, this.session);
    return true;
  }

  finalizeSession() {
    if (!this.session) return false;
    sessions.delete(this.session.token);
    this.session = null;
    return true;
  }

  restoreSession(token) {
    const session = sessions.get(token);
    if (!session) return false;
    this.session = session;
    return true;
  }

  async startSession(accessToken, refreshHash, refreshRaw, data = {}) {
    try {
      // console.log(`Starting session for token: ${accessToken}`);
      // await this.initializeSession(accessToken, data);
      await sessionManager.createAccessSession(accessToken, data);
      await sessionManager.createRefreshTokenByHash(
        refreshHash,
        data.sessionId,
        { createdBy: 'login' },
      );

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
  destroy() {
    this.emit('close');
    if (!this.session) return;
    this.finalizeSession();
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
      this.console.log('HTTPS server created with SSL certificates');
    } else {
      this.httpServer = http.createServer();
      this.console.log('HTTP server created (no SSL certificates found)');
    }

    const [port] = config.server.ports;
    this.listen(port);
    this.console.log(`API on port ${port} (${sslOptions ? 'HTTPS' : 'HTTP'})`);
  }

  getSSLOptions() {
    try {
      const certPath = path.join(process.cwd(), 'ssl', 'cert.pem');
      const keyPath = path.join(process.cwd(), 'ssl', 'key.pem');

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        };
      }

      // Alternative paths for development
      const devCertPath = path.join(process.cwd(), 'certs', 'cert.pem');
      const devKeyPath = path.join(process.cwd(), 'certs', 'key.pem');

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
      if (req.url.includes('api') && !req.url.startsWith('/api')) {
        req.url = extractPath(req.url);
        return;
      }
      const transport = new HttpTransport(this, req, res);
      if (!req.url.startsWith('/api'))
        return void this.application.static.serve(req.url, transport);

      const client = new Client(transport);
      const data = await receiveBody(req);
      this.rpc(client, data);

      req.on('close', () => {
        client.destroy();
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

  rpc(client, data) {
    const packet = jsonParse(data);
    if (!packet) {
      const error = new Error('JSON parsing error');
      client.error(500, { error, pass: true });
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
    /* TODO: check rights
    if (!client.session && proc.access !== 'public') {
      client.error(403, { id });
      return;
    }*/
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
