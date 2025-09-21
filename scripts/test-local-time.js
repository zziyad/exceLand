#!/usr/bin/env node

/**
 * Test Local Time Functionality
 *
 * This script tests the local time functions used in the session system
 */

const { buildCookieHeader } = require('../lib/common.js');

console.log('🕐 Testing Local Time Functionality\n');

// Test 1: Current time
const now = new Date();
console.log('Current time (UTC):', now.toUTCString());
console.log(
  'Current time (Local):',
  now.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
);

// Test 2: Cookie expiration (1 minute from now)
const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
console.log('\n1 minute from now (UTC):', oneMinuteFromNow.toUTCString());
console.log(
  '1 minute from now (Local):',
  oneMinuteFromNow.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
);

// Test 3: Cookie header with local time
const cookieHeader = buildCookieHeader({
  name: 'test-cookie',
  value: 'test-value',
  maxAgeSeconds: 60,
  domain: 'localhost',
  httpOnly: true,
  secure: false,
  sameSite: 'Lax',
});

console.log('\n🍪 Cookie Header with Local Time:');
console.log(cookieHeader);

// Test 4: Session expiration times
const accessTtl = 60; // 1 minute
const refreshTtl = 7 * 24 * 60 * 60; // 7 days

const accessExpires = new Date(now.getTime() + accessTtl * 1000);
const refreshExpires = new Date(now.getTime() + refreshTtl * 1000);

console.log('\n⏰ Session Expiration Times:');
console.log(
  'Access Token expires at (Local):',
  accessExpires.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
);
console.log(
  'Refresh Token expires at (Local):',
  refreshExpires.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
);

console.log('\n✅ Local time test completed!');
