'use strict';

const http = require('node:http');
const metautil = require('metautil');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TOKEN = 'token';
const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';
const COOKIE_DELETE = `${TOKEN}=deleted; Expires=${EPOCH}; ${LOCATION}=`;
const COOKIE_HOST = `Expires=${FUTURE}; ${LOCATION}`;

class Transport {
  constructor(server, req) {
    this.server = server;
    this.req = req;
    this.ip = req.socket.remoteAddress;
  }

  error(code = 500, { id, error = null, httpCode = null } = {}) {
    const { console } = this.server;
    const { url, method } = this.req;
    if (!httpCode) httpCode = error?.httpCode || code;
    const status = http.STATUS_CODES[httpCode];
    const pass = httpCode < 500 || httpCode > 599;
    const message = pass ? error?.message : status || 'Unknown error';
    const reason = `${code}\t${error ? error.stack : status}`;
    console.error(`${this.ip}\t${method}\t${url}\t${reason}`);
    const packet = { type: 'callback', id, error: { message, code, status } };
    this.send(packet, httpCode);
  }

  send(obj, code = 200) {
    const data = JSON.stringify(obj);
    this.write(data, code, 'json');
  }
}

class HttpTransport extends Transport {
  constructor(server, req, res) {
    super(server, req);
    this.res = res;
    if (req.method === 'OPTIONS') {
      console.log({ REQ: req.method });
      this.options();
    }
    req.on('close', () => {
      console.log('CLOSE');
    });
  }

  options() {
    const { res } = this;
    if (res.headersSent) return;
    res.writeHead(200, HEADERS);
    res.end();
  }

  write(data, httpCode = 200, ext = 'json') {
    if (this.res.writableEnded) return;
    const mimeType = MIME_TYPES[ext] || MIME_TYPES.html;
    this.res.writeHead(httpCode, { ...HEADERS, 'Content-Type': mimeType });
    this.res.end(data);
  }

  getCookies() {
    const { cookie } = this.req.headers;
    if (!cookie) return {};
    return metautil.parseCookies(cookie);
  }

  // sendSessionCookie(token) {
  //   const host = metautil.parseHost(this.req.headers.host);
  //   let cookie = `${TOKEN}=${token}; ${COOKIE_HOST}=${host}`;
  //   cookie += '; HttpOnly';
  //   this.res.setHeader('Set-Cookie', cookie);
  // }

  sendSessionCookie(token, TOKEN) {
    const host = metautil.parseHost(this.req.headers.host);
    const futureDate = new Date(Date.now() + 1 * 60 * 60 * 1000);

    // + 7 * 60 * 60 * 1000,
    console.log({ futureDate });
    const maxAgeSeconds = 1 * 60 * 60;
    let cookie = `${TOKEN}=${token}; Max-Age=${maxAgeSeconds}; Expires=${futureDate.toUTCString()}; ${COOKIE_HOST}=${host};`; // Add Secure attribute
    cookie += '; HttpOnly';
    console.log({ cookie });
    this.res.setHeader('Set-Cookie', cookie);
  }

  removeSessionCookie(TOKEN) {
    const host = metautil.parseHost(this.req.headers.host);
    console.log({ REMOVE: host });
    console.log({ SESSION_ID: this.req.headers.authorization, TOKEN });
    this.res.setHeader(
      'Set-Cookie',
      `${this.req.headers.authorization}=deleted; Expires=${EPOCH}; ${LOCATION}=` +
        host,
    );
  }

  redirect(location) {
    const { res } = this;
    if (res.headersSent) return;
    res.writeHead(302, { Location: location, ...HEADERS });
    res.end();
  }
}

class WsTransport extends Transport {
  constructor(server, req, connection) {
    super(server, req);
    this.connection = connection;
  }

  write(data) {
    this.connection.send(data);
  }
}

module.exports = { Transport, HttpTransport, WsTransport, MIME_TYPES, HEADERS };
