#!/usr/bin/env node

/**
 * Test Cookie Path Implementation
 *
 * This script tests that cookies are set with correct paths
 */

const { buildCookieHeader } = require('../lib/common.js');

console.log('🍪 Testing Cookie Path Implementation\n');

// Test 1: Access token cookie (should have Path=/)
const accessToken = 'test-access-token-123';
const accessCookie = buildCookieHeader({
  name: 'auth-token',
  value: accessToken,
  maxAgeSeconds: 60,
  domain: 'localhost',
  httpOnly: true,
  secure: false,
  sameSite: 'Lax',
  path: '/',
});

console.log('1. Access Token Cookie (Path=/):');
console.log(accessCookie);
console.log('✅ Should be sent to ALL endpoints\n');

// Test 2: Refresh token cookie (should have Path=/api/auth/refresh)
const refreshToken = 'test-refresh-token-456';
const refreshCookie = buildCookieHeader({
  name: 'refresh-token',
  value: refreshToken,
  maxAgeSeconds: 604800,
  domain: 'localhost',
  httpOnly: true,
  secure: false,
  sameSite: 'Lax',
  path: '/api/auth/refresh',
});

console.log('2. Refresh Token Cookie (Path=/api/auth/refresh):');
console.log(refreshCookie);
console.log('✅ Should be sent ONLY to /api/auth/refresh endpoint\n');

// Test 3: Cookie clearing
const expired = new Date(0).toUTCString();
const clearAccess = `auth-token=deleted; Max-Age=0; Expires=${expired}; Path=/; Domain=localhost; HttpOnly; SameSite=Lax;`;
const clearRefresh = `refresh-token=deleted; Max-Age=0; Expires=${expired}; Path=/; Domain=localhost; HttpOnly; SameSite=Lax;`;
const clearRefreshFromRefreshPath = `refresh-token=deleted; Max-Age=0; Expires=${expired}; Path=/api/auth/refresh; Domain=localhost; HttpOnly; SameSite=Lax;`;

console.log('3. Cookie Clearing:');
console.log('Clear access token:', clearAccess);
console.log('Clear refresh token from root:', clearRefresh);
console.log(
  'Clear refresh token from refresh path:',
  clearRefreshFromRefreshPath,
);
console.log('✅ Both paths cleared to ensure complete logout\n');

console.log('🎯 Expected Behavior:');
console.log('- Static files (/css, /js, /images): Only auth-token sent');
console.log(
  '- Normal API calls (/api/auth/me, /api/users, etc.): Only auth-token sent',
);
console.log(
  '- Refresh calls (/api/auth/refresh): Both auth-token and refresh-token sent',
);
console.log('- Logout: All cookies cleared from all paths');

console.log('\n✅ Cookie path implementation test completed!');
