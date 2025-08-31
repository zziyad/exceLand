/* eslint-disable max-len */
'use strict';

const http = require('node:http');
const metautil = require('metautil');
const { Readable } = require('node:stream');
const { buildCookieHeader } = require('../lib/common.js');

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
  // HSTS will be added conditionally for HTTPS responses
  // ACAO will be added dynamically when origin is allowed
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
// const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';
// const COOKIE_DELETE = `${TOKEN}=deleted; Expires=${EPOCH}; ${LOCATION}=`;
// const COOKIE_HOST = `Expires=${FUTURE}; ${LOCATION}`;
const COOKIE_HOST = 'Expires=Fri, 01 Jan 2100 00:00:00 GMT; Path=/; Domain';

class Transport {
  constructor(server, req) {
    this.server = server;
    this.req = req;
    this.ip = req.socket.remoteAddress;
  }

  getHeader(name) {
    return this.req.headers[String(name || '').toLowerCase()];
  }

  error(code = 500, { id, error = null, httpCode = null, headers: extraHeaders = null } = {}) {
    const { console } = this.server;
    const { url, method } = this.req;
    if (!httpCode) httpCode = error?.httpCode || code;
    const status = http.STATUS_CODES[httpCode];
    const pass = httpCode < 500 || httpCode > 599;
    const message = pass ? error?.message : status || 'Unknown error';
    const reason = `${code}\t${error ? error.stack : status}`;
    console.error(`${this.ip}\t${method}\t${url}\t${reason}`);
    const packet = { type: 'callback', id, error: { message, code, status } };
    const data = JSON.stringify(packet);
    this.send(data, httpCode, 'json', { headers: extraHeaders || undefined });
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
    console.log('OPTIONS HEADERS');
    const origin = this.req.headers.origin;
    const allowed = this.server.application?.config?.server?.cors
      ?.allowedOrigins || ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const allowedOrigins = new Set(allowed);
    const corsHeaders = { ...HEADERS };
    if (origin && allowedOrigins.has(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
      corsHeaders['Vary'] = 'Origin';
    }
    // Security headers on preflight
    corsHeaders['X-Frame-Options'] = 'DENY';
    corsHeaders['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
    if (this.server.isHttps === true) {
      corsHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubdomains; preload';
    }
    res.writeHead(204, corsHeaders);
    res.end();
  }

  async write(data, httpCode = 200, ext = 'json', options = {}) {
    const { res } = this;
    if (res.writableEnded) return;
    const streaming = data instanceof Readable;
    const mimeType = MIME_TYPES[ext] || MIME_TYPES.html;
    const origin = this.req.headers.origin;
    const allowed = this.server.application?.config?.server?.cors
      ?.allowedOrigins || ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const allowedOrigins = new Set(allowed);
    const headers = { ...HEADERS, 'Content-Type': mimeType };
    if (origin && allowedOrigins.has(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Vary'] = 'Origin';
    }
    headers['X-Frame-Options'] = 'DENY';
    headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
    if (this.server.isHttps === true) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubdomains; preload';
    }
    if (options?.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }
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
    const { cookie } = this.req.headers;
    if (!cookie) return {};
    return metautil.parseCookies(cookie);
  }

  getOrigin() {
    return this.req.headers.origin;
  }

  getReferrer() {
    return this.req.headers.referer || this.req.headers.referrer;
  }

  getUserAgent() {
    return this.req.headers['user-agent'] || '';
  }

  // sendSessionCookie(token) {
  //   const host = metautil.parseHost(this.req.headers.host);
  //   let cookie = `${TOKEN}=${token}; ${COOKIE_HOST}=${host}`;
  //   cookie += '; HttpOnly';
  //   this.res.setHeader('Set-Cookie', cookie);
  // }

  sendSessionCookie(accessToken, refreshRaw, ACCESS_TTL, REFRESH_TTL) {
    const host = metautil.parseHost(this.req.headers.host);
    const isHttps = this.server.isHttps === true;
    const secure = isHttps; // Secure cookies only over HTTPS
    const sameSite = isHttps ? 'None' : 'Lax'; // cross-site only on HTTPS
    const isLocalhost =
      host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const domain = isLocalhost ? undefined : host; // omit Domain for localhost/IP

    const authCookie = buildCookieHeader({
      name: 'auth-token',
      value: accessToken,
      maxAgeSeconds: ACCESS_TTL,
      domain,
      secure,
      sameSite,
    });
    const refreshCookie = buildCookieHeader({
      name: 'refresh-token',
      value: refreshRaw,
      maxAgeSeconds: REFRESH_TTL,
      domain,
      secure,
      sameSite,
    });

    console.log({ authCookie, refreshCookie });
    this.res.setHeader('Set-Cookie', [authCookie, refreshCookie]);
  }

  clearSessionCookies() {
    const host = metautil.parseHost(this.req.headers.host);
    const isHttps = this.server.isHttps === true;
    const secure = isHttps;
    const sameSite = isHttps ? 'None' : 'Lax';
    const isLocalhost =
      host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const domain = isLocalhost ? undefined : host;

    const expired = new Date(0).toUTCString();
    const base = (name) => {
      let cookie = `${name}=deleted; Max-Age=0; Expires=${expired}; Path=/;`;
      if (domain) cookie += ` Domain=${domain};`;
      cookie += ' HttpOnly;';
      if (secure) cookie += ' Secure;';
      if (sameSite) cookie += ` SameSite=${sameSite};`;
      return cookie;
    };

    const clearAuth = base('auth-token');
    const clearRefresh = base('refresh-token');
    // Also emit non-Secure variants for browsers that stored them without Secure (dev HTTP)
    const insecure = (name) => `${name}=deleted; Max-Age=0; Expires=${expired}; Path=/; HttpOnly;`;
    const clearAuthInsecure = insecure('auth-token');
    const clearRefreshInsecure = insecure('refresh-token');
    this.res.setHeader('Set-Cookie', [clearAuth, clearRefresh, clearAuthInsecure, clearRefreshInsecure]);
  }

  removeSessionCookie(sessionId) {
    const host = metautil.parseHost(this.req.headers.host);
    console.log({ REMOVE: host, sessionId });
    this.res.setHeader(
      'Set-Cookie',
      `${sessionId}=deleted; Expires=${EPOCH}; ${LOCATION}=` + host,
    );
  }

  redirect(location) {
    const { res } = this;
    if (res.headersSent) return;
    const origin = this.req.headers.origin;
    const allowed = this.server.application?.config?.server?.cors
      ?.allowedOrigins || ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const allowedOrigins = new Set(allowed);
    const headers = { Location: location, ...HEADERS };
    if (origin && allowedOrigins.has(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Vary'] = 'Origin';
    }
    res.writeHead(302, headers);
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
