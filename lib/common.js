'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const base64url = (buf) =>
  buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

function genRandomBuf(bytes = 32) {
  return crypto.randomBytes(bytes); // Buffer
}

// HMAC-SHA256 signature for access token
function signRandomBuf(secret, randomBuf) {
  const hmac = crypto.createHmac('sha256', secret).update(randomBuf).digest();
  return `${base64url(randomBuf)}.${base64url(hmac)}`; // string token
}

// verify signed token: returns Buffer randomBuf on success, null on failure
function verifySignedToken(secret, token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const rnd = Buffer.from(
      parts[0].replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    );
    const sig = Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    );
    const expected = crypto.createHmac('sha256', secret).update(rnd).digest();
    if (expected.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(expected, sig)) return null;
    return rnd;
  } catch (e) {
    return null;
  }
}

// Hash a token (refresh) for safe storage (hex)
function hashTokenHex(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SCRYPT_PREFIX = '$scrypt$N=32768,r=8,p=1,maxmem=67108864$';

const serializeHash = (hash, salt) => {
  const saltString = salt.toString('base64').split('=')[0];
  const hashString = hash.toString('base64').split('=')[0];
  return `${SCRYPT_PREFIX}${saltString}$${hashString}`;
};

const parsePath = (relPath) => {
  const name = path.basename(relPath, '.js');
  const names = relPath.split(path.sep);
  names[names.length - 1] = name;
  return names;
};

const parseOptions = (options) => {
  const values = [];
  const items = options.split(',');
  for (const item of items) {
    const [key, val] = item.split('=');
    values.push([key, Number(val)]);
  }
  return Object.fromEntries(values);
};

const extractPath = (inputPath) => {
  const parts = inputPath.split('/');
  if (parts[2] === 'api') {
    const newPath = '/' + parts.slice(2).join('/');
    console.log({ inputPath, newPath });
    return newPath;
  } else {
    return "Second parameter is not 'api'";
  }
};

const deserializeHash = (phcString) => {
  const [, name, options, salt64, hash64] = phcString.split('$');
  if (name !== 'scrypt') {
    throw new Error('Node.js crypto module only supports scrypt');
  }
  const params = parseOptions(options);
  const salt = Buffer.from(salt64, 'base64');
  const hash = Buffer.from(hash64, 'base64');
  return { params, salt, hash };
};

const SALT_LEN = 32;
const KEY_LEN = 64;

const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(SALT_LEN, (err, salt) => {
      if (err) {
        reject(err);
        return;
      }
      crypto.scrypt(password, salt, KEY_LEN, SCRYPT_PARAMS, (err, hash) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(serializeHash(hash, salt));
      });
    });
  });

const validatePassword = (password, serHash) => {
  const { params, salt, hash } = deserializeHash(serHash);
  return new Promise((resolve, reject) => {
    const callback = (err, hashedPassword) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(crypto.timingSafeEqual(hashedPassword, hash));
    };
    crypto.scrypt(password, salt, hash.length, params, callback);
  });
};

const jsonParse = (buffer) => {
  if (buffer.length === 0) return null;
  try {
    return JSON.parse(buffer);
  } catch {
    return null;
  }
};

const generateUniqueFileName = (fileName) => {
  const sanitizedFileName = fileName.replace(/\s+/g, '_');
  const uniqueFN = `${crypto.randomUUID()}_${sanitizedFileName}`;
  return uniqueFN;
};

// IPv4 helpers
const IPV4_OCTETS = 4;
const MAX_32_BIT = 0xffffffff;

const ipToInt = (ip) => {
  if (typeof ip !== 'string') return Number.NaN;
  const bytes = ip.split('.');
  if (bytes.length !== IPV4_OCTETS) return Number.NaN;
  let res = 0;
  for (const byte of bytes) res = res * 256 + parseInt(byte, 10);
  return res;
};

const intToIp = (int) => {
  if (!Number.isInteger(int) || int < 0 || int > MAX_32_BIT) {
    throw new Error('Invalid integer for IPv4 address');
  }
  const octets = new Array(IPV4_OCTETS);
  for (let i = 0; i < IPV4_OCTETS; i++) {
    const shift = 8 * (IPV4_OCTETS - 1 - i);
    octets[i] = (int >>> shift) & 0xff;
  }
  return octets.join('.');
};

const sameSubnet = (ipA, ipB, maskBits = 24) => {
  const a = ipToInt(ipA);
  const b = ipToInt(ipB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (a & mask) === (b & mask);
};

const isPrivate = (ip) => {
  const n = ipToInt(ip);
  if (!Number.isFinite(n)) return false;
  // 10.0.0.0/8
  if ((n & 0xff000000) === 0x0a000000) return true;
  // 172.16.0.0/12
  if ((n & 0xfff00000) === 0xac100000) return true;
  // 192.168.0.0/16
  if ((n & 0xffff0000) === 0xc0a80000) return true;
  return false;
};

// Normalize IPv6-mapped IPv4 addresses (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
const normalizeIp = (ip) => {
  if (!ip || typeof ip !== 'string') return '';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    const parts = ip.split(':');
    return parts[parts.length - 1] || ip;
  }
  return ip;
};

const receiveBody = async (req) => {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  return Buffer.concat(buffers).toString();
};

const execute = (method) =>
  method().catch((error) => {
    const msg = `Failed to execute method: ${error?.message}`;
    console.log(msg, error.stack);
    return Promise.reject(error);
  });

function buildCookieHeader({
  name,
  value,
  maxAgeSeconds,
  domain,
  httpOnly = true,
  secure = true,
  sameSite = 'None',
  path = '/',
}) {
  // RFC 6265 requires Expires to be an HTTP-date in GMT/UTC
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  let cookie = `${name}=${value}; Max-Age=${Math.floor(
    maxAgeSeconds,
  )}; Expires=${expires}; Path=${path};`;
  if (domain) cookie += ` Domain=${domain};`;
  if (httpOnly) cookie += ' HttpOnly;';
  if (secure) cookie += ' Secure;';
  if (sameSite) cookie += ` SameSite=${sameSite};`;
  return cookie;
}

function makeTokens(secret) {
  const rndAccess = genRandomBuf(32);
  const accessToken = signRandomBuf(secret, rndAccess); // signed string
  const refreshRaw = genRandomBuf(64).toString('base64'); // store raw in cookie
  const refreshHash = hashTokenHex(refreshRaw); // store hash in redis
  return { accessToken, refreshRaw, refreshHash };
}

module.exports = Object.freeze({
  hashPassword,
  validatePassword,
  generateUniqueFileName,
  jsonParse,
  receiveBody,
  parsePath,
  execute,
  extractPath,
  genRandomBuf,
  signRandomBuf,
  verifySignedToken,
  hashTokenHex,
  buildCookieHeader,
  makeTokens,
  sameSubnet,
  intToIp,
  ipToInt,
  isPrivate,
  normalizeIp,
});
