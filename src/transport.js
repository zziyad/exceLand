/* eslint-disable max-len */
'use strict';

const http = require('node:http');
const metautil = require('metautil');
const { Readable } = require('node:stream');

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
  'Access-Control-Allow-Origin': 'http://localhost:8080',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type ,Accept',
  'Access-Control-Allow-Credentials': 'true',
};
const TOKEN = 'token';
const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/'; // Simplified, domain added dynamically
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
    console.log({ statusCODE: httpCode });

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
    req.on('close', () => {
      console.log('CLOSE');
    });
  }

  async write(data, httpCode = 200, ext = 'json', options = {}) {
    const { res } = this;
    const origin = this.req.headers.origin;
    console.log({ origin_TRNASPORT: origin });

    if (res.writableEnded) return;
    const streaming = data instanceof Readable;
    const mimeType = MIME_TYPES[ext] || MIME_TYPES.html;
    const headers = {
      ...HEADERS,
      // 'Access-Control-Allow-Origin': origin ? origin : 'http://localhost:3000',
      'Content-Type': mimeType,
    };
    if (httpCode === 206) {
      const { start, end, size = '*' } = options;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      headers['Accept-Ranges'] = 'bytes';
      headers['Content-Length'] = end - start + 1;
    }
    if (!streaming) headers['Content-Length'] = data.length;
    res.writeHead(httpCode, headers);
    if (streaming) data.pipe(res);
    else res.end(data);
  }

  getCookies() {
    const headers = this.req.headers;
    const { cookie } = this.req.headers;
    if (!cookie) return {};
    return { coockie: metautil.parseCookies(cookie), headers };
  }

  sendSessionCookie(token, expiryMs = 10 * 60 * 1000) {
    let isProduction = false;
    const host = metautil.parseHost(this.req.headers.host);

    const expireDate = new Date(Date.now() + expiryMs).toUTCString();

    let cookie = `${TOKEN}=${token}; ${LOCATION}; Expires=${expireDate}`;
    cookie += `; Domain=${host}`;
    cookie += '; HttpOnly'; // Prevent JS access
    cookie += isProduction ? '; Secure' : ''; // HTTPS only in production
    cookie += '; SameSite=Lax'; // CSRF protection

    this.res.setHeader('Set-Cookie', cookie);
  }

  // removeSessionCookie() {
  //   const host = metautil.parseHost(this.req.headers.host);
  //   // console.log({ REMOVE: host });
  //   // console.log({ SESSION_ID: this.req.headers.authorization, TOKEN });
  //   this.res.setHeader('Set-Cookie', `Expires=${EPOCH}; ${LOCATION}=` + host);
  // }

  removeSessionCookie() {
    const host = metautil.parseHost(this.req.headers.host); // e.g., "localhost"
    const cookie = `token=deleted; Path=/; Expires=${EPOCH}; Domain=${host}; HttpOnly; SameSite=Lax`;
    console.log({ REMOVE_COOKIE: cookie }); // Debug log
    this.res.setHeader('Set-Cookie', cookie);
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
