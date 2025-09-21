'use strict';

const {
  getCorsConfig,
  getSessionTtl,
  getSecurityHeaders,
  getCorsHeaders,
  isOriginAllowed,
  validateCorsConfig,
} = require('./config-utils.js');

// Test configuration
const testConfig = {
  server: {
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://localhost:3000',
      ],
      allowCredentials: true,
      maxAge: 86400,
    },
  },
  sessions: {
    accessTtl: 60, // 1 minute
    refreshTtl: 604800, // 7 days
  },
};

function testConfigUtils() {
  console.log('🧪 Testing simple config utilities...\n');

  // Test CORS config
  console.log('🌐 CORS Config:');
  const corsConfig = getCorsConfig(testConfig);
  console.log(
    `  - Allowed origins: ${corsConfig.allowedOrigins.length} configured`,
  );
  console.log(`  - Allow credentials: ${corsConfig.allowCredentials}`);
  console.log(`  - Max age: ${corsConfig.maxAge}s\n`);

  // Test session TTL
  console.log('⏱️  Session TTL:');
  const { accessTtl, refreshTtl } = getSessionTtl(testConfig);
  console.log(`  - Access TTL: ${accessTtl}s (${accessTtl / 60} minutes)`);
  console.log(`  - Refresh TTL: ${refreshTtl}s (${refreshTtl / 3600} hours)\n`);

  // Test security headers
  console.log('🔒 Security Headers:');
  const securityHeaders = getSecurityHeaders(false);
  console.log(`  - XSS Protection: ${securityHeaders['X-XSS-Protection']}`);
  console.log(`  - Frame Options: ${securityHeaders['X-Frame-Options']}`);
  console.log(
    `  - HSTS (HTTPS): ${
      securityHeaders['Strict-Transport-Security'] || 'Not set'
    }\n`,
  );

  // Test CORS headers
  console.log('📋 CORS Headers:');
  const corsHeaders = getCorsHeaders(
    corsConfig,
    'http://localhost:3000',
    false,
  );
  console.log(
    `  - Allow Origin: ${corsHeaders['Access-Control-Allow-Origin']}`,
  );
  console.log(
    `  - Allow Methods: ${corsHeaders['Access-Control-Allow-Methods']}`,
  );
  console.log(
    `  - Allow Credentials: ${corsHeaders['Access-Control-Allow-Credentials']}\n`,
  );

  // Test origin validation
  console.log('✅ Origin Validation:');
  console.log(
    `  - localhost:3000 allowed: ${isOriginAllowed(
      testConfig,
      'http://localhost:3000',
    )}`,
  );
  console.log(
    `  - localhost:3001 allowed: ${isOriginAllowed(
      testConfig,
      'http://localhost:3001',
    )}`,
  );
  console.log(
    `  - evil.com allowed: ${isOriginAllowed(testConfig, 'http://evil.com')}\n`,
  );

  // Test CORS validation
  console.log('🔍 CORS Validation:');
  const validation = validateCorsConfig(testConfig);
  console.log(`  - Valid: ${validation.valid}`);
  if (validation.warnings.length > 0) {
    console.log(`  - Warnings: ${validation.warnings.join(', ')}`);
  }

  console.log('\n✅ Simple config utilities test completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
  testConfigUtils();
}

module.exports = { testConfigUtils };
