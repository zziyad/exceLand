'use strict';

const { node, npm, metarhia } = require('./dependencies.js');
const { receiveBody, jsonParse, extractPath, generateUniqueFileName } = require('../lib/common.js');
const { HttpTransport, MIME_TYPES, HEADERS } = require('./transport.js');
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

  constructor(transport, console) {
    this.#transport = transport;
    this.ip = transport.ip;
    // this.session = null;
    this.console = console;
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
    const z = metarhia.metautil.parseCookies(cookie);
    // console.log({ cookieZ: z });
    return z;
  }

  async initializeSession(token, data = {}) {
    this.finalizeSession();
    this.session = new Session(token, data);
    await redisSet(token, DEFAULT_SESSION_TIME, JSON.stringify(this.session));
    return true;
  }

  startSession(token, data = {}) {
    this.initializeSession(token, data);
    if (!this.#transport.connection)
      this.#transport.sendSessionCookie(token, data.sessionId);
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

  removeSession(token) {
    // console.log({ ses: this.session });
    this.#transport.removeSessionCookie(token);
  }

  destroy() {
    if (!this.session) return;
    redisDel(this.session.token);
  }

  async saveFileStream(fileStream, filePath) {
    // const pathTosave = '../application/static/images';
    const pathTosave = `../../exceland/public/images`;

    // const filePath = node.path.join(__dirname, pathTosave, fileName);

    // console.log({ filePath, fileName, appPath: this.path });
    const writeStream = node.fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      fileStream.on('end', () => resolve(filePath));
      fileStream.on('error', reject);
    });
  }
}

const serveStatic = (staticPath) => async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = node.path.join(staticPath, url);
  try {
    const data = await node.fs.promises.readFile(filePath);
    const fileExt = node.path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { ...HEADERS, 'Content-Type': mimeType });
    res.end(data);
  } catch (err) {
    const filePath = node.path.join(staticPath, '/index.html');
    const data = await node.fs.promises.readFile(filePath);

    // console.log('STATIC', req.url, data);
    res.end(data);
  }
};

class Server {
  constructor(application) {
    this.application = application;
    const { console, routing, config } = application;
    const staticPath = node.path.join(application.path, './static');
    this.staticHandler = serveStatic(staticPath);
    this.routing = routing;
    this.console = console;
    this.httpServer = node.http.createServer();
    const [port] = config.server.ports;
    this.listen(port);
    this.id = null;
    console.log(`API on port ${port}`);
  }

  listen(port) {
    this.httpServer.on('request', async (req, res) => {
      this.id = req.headers['authorization'];
      // console.log({ URL: req.url, id: this.id, tt: req.headers });
      if (req.url.includes('api') && !req.url.startsWith('/api')) {
        req.url = extractPath(req.url);
      }

      if (!req.url.startsWith('/api')) {
        this.staticHandler(req, res);
        return;
      }

      const transport = new HttpTransport(this, req, res);
      const client = new Client(transport);

      if (req.method === 'POST' && req.url === '/api/upload') {
        console.log('HEREEEEE');
        await this.handleUpload(req, res, client);
        return;
      }

      if (req.method !== 'POST') return transport.error(403);
      const data = await receiveBody(req);
      this.rpc(client, data);

      req.on('close', () => {
        client.destroy();
      });
    });

    this.httpServer.listen(port);
  }

  async handleUpload(req, res, client) {
    const multiparty = npm.multiparty;
    const form = new multiparty.Form();

    form.parse(req, async (error, fields, files) => {
      if (error) {
        client.error(500, { error: 'File upload failed' });
        return;
      }

      const resourcesPath = node.path.join(
        this.application.path,
        './static/images/',
      );

      try {
        const fileSavePromises = [];
        const fileNames = [];
        Object.keys(files).forEach((key) => {
          const file = files[key][0];
          const fileStream = node.fs.createReadStream(file.path);
          const fileName = fields[`fileName${key.replace('file', '')}`][0];
          const uniqueFN = generateUniqueFileName(fileName);
          const ABC_PATH = resourcesPath + uniqueFN;
          const pathToSend = `../images/${uniqueFN}`;
          fileNames.push(pathToSend);
          console.log({ fields, ABC_PATH });
          fileSavePromises.push(client.saveFileStream(fileStream, ABC_PATH));
        });

        await Promise.all(fileSavePromises);
        console.log({ fileNames });
        client.send({ status: 'success', paths: fileNames }, 200);
      } catch (error) {
        client.error(500, { error: 'File upload failed' });
      }
    });
  }

  async rpc(client, data) {
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
    const [unit, method] = packet.method.split('/');
    const proc = this.routing.get(unit + '.' + method);
    if (!proc) return void client.error(404, { id });
    const access = proc().access;
    const context = client.createContext();
    const tid = this.id;
    const cookies = client.getCookies();
    const token = cookies[tid];
    // console.log({ cookies, tid, token, css: client });
    if (!token) console.log({ NO_TOKE: token });
    await client.restoreSession(token);
    const { secret } = this.application.config.sessions;
    const validToken = metarhia.metautil.validateToken(secret, token);

    if (access !== 'public') {
      if (!validToken) return void client.error(401, { id });
      if (!client.session) {
        client.destroy();
        return void client.error(401, { id });
      }
      const { isAdmin } = context.client.session.state;
      if (!isAdmin) return void client.error(403, { id });
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
}

module.exports = { Server };
