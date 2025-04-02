'use strict';

const { node, npm, metarhia } = require('./dependencies.js');
const {
  receiveBody,
  jsonParse,
  extractPath,
  // generateUniqueFileName,
} = require('../lib/common.js');
const { HttpTransport, HEADERS } = require('./transport.js');
const jwt = require('jsonwebtoken');
const util = require('util');
const jwtVerifyAsync = util.promisify(jwt.verify);

const redisClient = npm.redis.createClient('6379', '127.0.0.1');
redisClient.on('error', (error) => console.error(error));
const redisSet = node.util.promisify(redisClient.setex).bind(redisClient);
const redisGet = node.util.promisify(redisClient.get).bind(redisClient);
const redisDel = node.util.promisify(redisClient.del).bind(redisClient);
const DEFAULT_SESSION_TIME = 360000; //SEC|60 * 60

class Session {
  constructor(token, data) {
    this.token = token;
    this.state = { ...data };
  }
}

class Context {
  constructor(client) {
    this.client = client;
    this.uuid = node.crypto.randomUUID();
    this.state = {};
    this.session = client?.session || null;
  }
}

class Client {
  #transport;

  constructor(transport, console, config) {
    this.#transport = transport;
    this.ip = transport.ip;
    // this.session = null;
    this.console = console;
    this.config = config;
    this.encodedKey = new TextEncoder().encode(config.sessions.secret);
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

  getCookies() {
    const { cookie } = this.#transport.req.headers;
    if (!cookie) return {};
    const { token } = metarhia.metautil.parseCookies(cookie);
    return token;
  }

  async initializeSession(token, data = {}) {
    this.finalizeSession();
    this.session = new Session(token, data);
    await redisSet(token, DEFAULT_SESSION_TIME, JSON.stringify(this.session));
    return true;
  }

  startSession(token, data = {}) {
    // this.initializeSession(token, data);
    console.log({ transport_connect: !this.#transport.connection, token });

    if (!this.#transport.connection) this.#transport.sendSessionCookie(token);
    return true;
  }

  finalizeSession() {
    if (!this.session) return false;
    console.log('FINALIZATION');
    redisDel(this.session.token);
    this.session = null;
    return true;
  }

  async restoreSession(token) {
    if (!token) return false;
    const session = await redisGet(token);
    if (!session) return false;
    this.session = JSON.parse(session);
    return true;
  }

  redirect(location) {
    console.log('REDIRECT');
    this.#transport.redirect(location);
  }

  removeSession() {
    const token = this.getCookies();
    // console.log({ ses: this.session });
    this.#transport.removeSessionCookie(token);
  }

  destroy() {
    this.res.clearCookie('token');
    // if (!this.session) return;
    // redisDel(this.session.token);
  }

  async saveFileStream(fileStream, filePath) {
    // const pathTosave = '../application/static/images';
    const writeStream = node.fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      fileStream.on('end', () => resolve(filePath));
      fileStream.on('error', reject);
    });
  }

  async encrypt(payload) {
    console.log({ payload, now: Date.now() });
    const token = jwt.sign(
      { ...payload, iat: Math.floor(Date.now() / 1000) }, // Add issued-at timestamp
      this.config.sessions.secret,
      { expiresIn: '1m' },
    );
    return token;
  }

  async decrypt(token) {
    try {
      const payload = jwt.verify(token, this.config.sessions.secret);
      return payload;
    } catch (error) {
      console.error('Failed to verify session:', error.message);
      if (error.name === 'TokenExpiredError') {
        throw new Error('jwt expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('invalid token');
      }
      throw error; // Other unexpected errors
    }
  }

  async authenticate(token) {
    try {
      const { req } = this.#transport;
      if (!token) return void this.error(401, { error: 'No token provided' });
      const decoded = await this.decrypt(token);
      req.user = decoded;
      return true;
    } catch (error) {
      this.error(403);
    }
  }

  async authorize(roles) {
    if (!roles.includes(this.#transport.req.user.role)) {
      return void this.error(403);
    }
  }
}

class Server {
  constructor(application) {
    this.application = application;
    const { console, routing, config } = application;
    this.routing = routing;
    this.console = console;
    this.httpServer = node.http.createServer();
    const [port] = config.server.ports;
    this.config = config;
    this.listen(port);
    this.id = null;
    console.log(`API on port ${port}`);
  }

  listen(port) {
    this.httpServer.on('request', async (req, res) => {
      console.log({ URL: req.url, header: req.header });

      if (req.url.includes('api') && !req.url.startsWith('/api'))
        req.url = extractPath(req.url);

      const transport = new HttpTransport(this, req, res);

      if (!req.url.startsWith('/api'))
        return void this.application.static.serve(req.url, transport);

      const client = new Client(transport, this.console, this.config);

      this.console.log(`${client.ip}t${req.method}\t${req.url}`);
      if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        console.log({ origin });

        res.writeHead(200, {
          ...HEADERS,
          'Access-Control-Allow-Origin': origin
            ? origin
            : 'http://localhost:3000',
        });
        return res.end();
      }

      if (req.method === 'POST' && req.url === '/api/upload')
        return void (await this.handleUpload(req, res, client));

      if (req.method !== 'POST') return transport.error(403);

      const data = await receiveBody(req);
      this.rpc(client, data);
      req.on('close', () => client.destroy());
    });
    this.httpServer.listen(port);
  }

  async handleUpload(req, res, client) {
    const boundary = req.headers['content-type']
      .split('; ')[1]
      .replace('boundary=', '');
    const boundaryBuffer = node.buffer.from(`--${boundary}`);
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      const rawData = Buffer.concat(chunks);
      chunks.length = 0;
      // Find file part in the buffer by searching for the boundary
      const parts = [];
      let start = 0;
      while (start < rawData.length) {
        const boundaryIndex = rawData.indexOf(boundaryBuffer, start);
        if (boundaryIndex === -1) break;
        const part = rawData.slice(start, boundaryIndex);
        if (part.length) parts.push(part);
        start = boundaryIndex + boundaryBuffer.length;
      }

      const filePart = parts.find((part) =>
        part.includes(node.buffer.from('filename=')),
      );
      parts.length = 0;
      if (!filePart) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('No file found');
      }
      // Extract filename from Content-Disposition
      const filePartString = filePart.toString();
      const fileNameMatch = filePartString.match(/filename="(.+)"/);
      let fileName = 'uploaded_file.txt';
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
      // Find start and end of file data
      const headerEndIndex = filePart.indexOf('\r\n\r\n') + 4;
      const fileData = filePart.slice(
        headerEndIndex,
        filePart.lastIndexOf('\r\n'),
      );
      const fileBuffer = Buffer.from(fileData);
      const fileExtension = node.path.extname(fileName).toLowerCase();
      // const magicNumbers = fileBuffer.slice(0, 4).toString('hex');
      // console.log('File Magic Numbers:', magicNumbers, fileExtension);
      // let validExtension = false;

      if (fileExtension !== '.txt') {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Invalid file type');
      }
      // Save the file to disk
      // const filePath = node.path.join(resourcesPath, fileName);
      const proc = this.routing.get('file.upload');
      const z = await proc(client).method({ fileName, fileBuffer });
      // console.log({ z });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(z.response));
    });
  }

  async rpc(client, data) {
    const packet = jsonParse(data);

    if (!packet) {
      const error = new Error('JSON parsing error');
      client.error(500, { error, pass: true });
      return;
    }

    console.log({ packet });

    const { id, type, args } = packet;
    if (type === 'http') return void this.request(client, packet);
    if (type !== 'call' || !id || !args) {
      const error = new Error('Packet structure error');
      client.error(400, { id, error, pass: true });
      return;
    }
    const [unit, method] = packet.method.split('/');
    const proc = this.routing.get(unit + '.' + method);
    if (!proc) return void client.error(404, { id });
    const access = proc().access;
    const context = client.createContext();

    if (access !== 'public') {
      const token = client.getCookies();
      const validToken = await client.authenticate(token);
      if (!validToken) return void client.error(401, { id });
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
        console.log({ error });
        client.error(error.code, { id, error });
      });
  }

  async request(client, packet) {
    console.log({ packet });
    const [unit, method] = packet.method.split('/');
    console.log({ unit, method });
    const proc = this.routing.get(unit + '.' + method);
    if (!proc) return void client.error(404);
    const context = client.createContext();

    this.console.log(`${client.ip}\t${packet.path}`);
    proc(context)
      .method(packet.args)
      .then((result) => {
        if (result?.constructor?.name === 'Error') {
          const { code, httpCode = 200 } = result;
          return void client.error(code, { error: result, httpCode });
        }
        // client.send({ result });
      })
      .catch((error) => {
        client.error(error.code, { error });
      });
  }
}

module.exports = { Server };
