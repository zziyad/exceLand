'use strict';

const { HttpTransport, HEADERS } = require('./transport.js');
const { Client } = require('./client.js');
const { receiveBody, jsonParse, extractPath } = require('../lib/common.js');
const { node } = require('./dependencies.js');

class Server {
  constructor(application) {
    const { console: console, routing, config } = application;
    this.application = application;
    this.routing = routing;
    this.console = console;
    this.config = config;
    this.httpServer = node.http.createServer();
    this.listen(config.server.ports[0]);
    this.console.info(`API on port ${config.server.ports[0]}`);
  }

  listen(port) {
    this.httpServer.on('request', async (req, res) => {
      if (req.url.includes('api') && !req.url.startsWith('/api')) {
        req.url = extractPath(req.url);
      }

      const transport = new HttpTransport(this, req, res);
      const client = new Client(transport, this.console, this.config);

      this.console.info(`${client.ip}\t${req.method}\t${req.url}`);

      if (!req.url.startsWith('/api')) {
        return this.application.static.serve(req.url, transport);
      }

      if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        res.writeHead(200, {
          ...HEADERS,
          'Access-Control-Allow-Origin': origin || '*',
        });
        return res.end();
      }

      if (req.method === 'POST' && req.url === '/api/upload') {
        return this.handleUpload(req, res, client);
      }

      if (req.method !== 'POST') return transport.error(403);

      const data = await receiveBody(req);
      await this.rpc(client, data);

      req.on('close', () => client.finalizeSession());
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

    const { id, type, args } = packet;
    // if (type === 'http') return void this.request(client, packet);
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
      try {
        const token = client.getCookies();
        await client.authenticate(token);
      } catch (error) {
        return client.error(error.message === 'No token provided' ? 401 : 403, {
          id,
          error,
        });
      }
    }

    this.console.info(`${client.ip}\t${packet.method}`);
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
        // console.log({ error });
        client.error(error.code, { id, error });
      });
  }
}

module.exports = { Server };
