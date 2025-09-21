'use strict';

/**
 * Simple configuration utilities
 * Centralizes common config access patterns to reduce duplication
 */

/**
 * Get CORS configuration with fallbacks
 * @param {Object} config - Application config
 * @returns {Object} CORS configuration
 */
function getCorsConfig(config) {
  const cors = config?.server?.cors || {};
  return {
    allowedOrigins: cors.allowedOrigins || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    allowCredentials: cors.allowCredentials !== false,
    maxAge: cors.maxAge || 86400,
    allowMethods: cors.allowMethods || [
      'POST',
      'GET',
      'OPTIONS',
      'PUT',
      'DELETE',
    ],
    allowHeaders: cors.allowHeaders || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
  };
}

/**
 * Get session TTL configuration with environment variable fallbacks
 * @param {Object} config - Application config
 * @returns {Object} Session TTL configuration
 */
function getSessionTtl(config) {
  const sessions = config?.sessions || {};
  const accessTtl =
    sessions.accessTtl || Number(process.env.ACCESS_TOKEN_TTL) || 15 * 60;
  const refreshTtl =
    sessions.refreshTtl ||
    Number(process.env.REFRESH_TOKEN_TTL) ||
    7 * 24 * 60 * 60;

  return { accessTtl, refreshTtl };
}

/**
 * Get security headers configuration
 * @param {boolean} isHttps - Whether HTTPS is enabled
 * @returns {Object} Security headers
 */
function getSecurityHeaders(isHttps = false) {
  const headers = {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy':
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  };

  if (isHttps) {
    headers['Strict-Transport-Security'] =
      'max-age=31536000; includeSubdomains; preload';
  }

  return headers;
}

/**
 * Get CORS headers for a specific origin
 * @param {Object} corsConfig - CORS configuration
 * @param {string} origin - Request origin
 * @param {boolean} isHttps - Whether HTTPS is enabled
 * @returns {Object} CORS headers
 */
function getCorsHeaders(corsConfig, origin, isHttps = false) {
  const securityHeaders = getSecurityHeaders(isHttps);
  const corsHeaders = {
    ...securityHeaders,
    'Access-Control-Allow-Methods': corsConfig.allowMethods.join(', '),
    'Access-Control-Allow-Headers': corsConfig.allowHeaders.join(', '),
    'Access-Control-Allow-Credentials': corsConfig.allowCredentials.toString(),
    'Access-Control-Max-Age': corsConfig.maxAge.toString(),
  };

  // Add origin if allowed
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
    corsHeaders['Vary'] = 'Origin';
  }

  return corsHeaders;
}

/**
 * Check if origin is allowed for CORS
 * @param {Object} config - Application config
 * @param {string} origin - Request origin
 * @returns {boolean} Whether origin is allowed
 */
function isOriginAllowed(config, origin) {
  const corsConfig = getCorsConfig(config);
  return corsConfig.allowedOrigins.includes(origin);
}

/**
 * Validate CORS configuration for production
 * @param {Object} config - Application config
 * @returns {Object} Validation result
 */
function validateCorsConfig(config) {
  const corsConfig = getCorsConfig(config);
  const warnings = [];

  if (corsConfig.allowedOrigins.includes('*')) {
    warnings.push(
      'CORS allows all origins (*) - not recommended for production',
    );
  }

  if (corsConfig.allowedOrigins.length === 0) {
    warnings.push('No CORS origins configured');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

module.exports = {
  getCorsConfig,
  getSessionTtl,
  getSecurityHeaders,
  getCorsHeaders,
  isOriginAllowed,
  validateCorsConfig,
};
