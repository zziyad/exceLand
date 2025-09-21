#!/usr/bin/env node

/**
 * Session TTL Management Utility
 *
 * This script helps you view and modify session TTL values
 * Usage: node scripts/session-ttl.js [command] [value]
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../application/config/sessions.js');
const ENV_FILE_PATH = path.join(__dirname, '../.env');

// Default TTL values (in seconds)
const DEFAULT_TTL = {
  access: 15 * 60, // 15 minutes
  refresh: 7 * 24 * 60 * 60, // 7 days
};

// Helper functions
const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
};

const parseDuration = (input) => {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return null;
  }
};

const readConfig = () => {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    // Extract TTL values using regex
    const accessMatch = content.match(/accessTtl:\s*([^,\n]+)/);
    const refreshMatch = content.match(/refreshTtl:\s*([^,\n]+)/);

    return {
      access: accessMatch ? eval(accessMatch[1]) : DEFAULT_TTL.access,
      refresh: refreshMatch ? eval(refreshMatch[1]) : DEFAULT_TTL.refresh,
    };
  } catch (error) {
    console.error('Error reading config:', error.message);
    return DEFAULT_TTL;
  }
};

const updateConfig = (accessTtl, refreshTtl) => {
  try {
    let content = fs.readFileSync(CONFIG_PATH, 'utf8');

    // Update access TTL
    content = content.replace(
      /accessTtl:\s*[^,\n]+/,
      `accessTtl: ${accessTtl}`,
    );

    // Update refresh TTL
    content = content.replace(
      /refreshTtl:\s*[^,\n]+/,
      `refreshTtl: ${refreshTtl}`,
    );

    fs.writeFileSync(CONFIG_PATH, content);
    console.log('✅ Config file updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating config:', error.message);
    return false;
  }
};

const showCurrent = () => {
  const config = readConfig();
  console.log('\n📋 Current Session TTL Configuration:');
  console.log('=====================================');
  console.log(
    `Access Token:  ${formatDuration(config.access)} (${
      config.access
    } seconds)`,
  );
  console.log(
    `Refresh Token: ${formatDuration(config.refresh)} (${
      config.refresh
    } seconds)`,
  );
  console.log('');

  // Show environment variable examples
  console.log('🔧 To override with environment variables:');
  console.log(`   ACCESS_TOKEN_TTL=${config.access}`);
  console.log(`   REFRESH_TOKEN_TTL=${config.refresh}`);
  console.log('');
};

const showHelp = () => {
  console.log(`
🔄 Session TTL Management Utility

Usage: node scripts/session-ttl.js [command] [value]

Commands:
  show                    - Display current TTL values
  set-access <duration>   - Set access token TTL
  set-refresh <duration>  - Set refresh token TTL
  reset                   - Reset to default values
  help                    - Show this help

Duration Format:
  <number><unit> where unit is:
    s - seconds (e.g., 900s)
    m - minutes (e.g., 15m)
    h - hours (e.g., 2h)
    d - days (e.g., 7d)

Examples:
  node scripts/session-ttl.js show
  node scripts/session-ttl.js set-access 30m
  node scripts/session-ttl.js set-refresh 30d
  node scripts/session-ttl.js reset
`);
};

const main = () => {
  const command = process.argv[2];
  const value = process.argv[3];

  switch (command) {
    case 'show':
      showCurrent();
      break;

    case 'set-access':
      if (!value) {
        console.error('❌ Please provide a duration value (e.g., 30m, 2h)');
        process.exit(1);
      }
      const accessSeconds = parseDuration(value);
      if (accessSeconds === null) {
        console.error(
          '❌ Invalid duration format. Use: <number><unit> (e.g., 30m, 2h)',
        );
        process.exit(1);
      }
      const current = readConfig();
      if (updateConfig(accessSeconds, current.refresh)) {
        console.log(
          `✅ Access token TTL set to ${formatDuration(accessSeconds)}`,
        );
        showCurrent();
      }
      break;

    case 'set-refresh':
      if (!value) {
        console.error('❌ Please provide a duration value (e.g., 7d, 30d)');
        process.exit(1);
      }
      const refreshSeconds = parseDuration(value);
      if (refreshSeconds === null) {
        console.error(
          '❌ Invalid duration format. Use: <number><unit> (e.g., 7d, 30d)',
        );
        process.exit(1);
      }
      const currentRefresh = readConfig();
      if (updateConfig(currentRefresh.access, refreshSeconds)) {
        console.log(
          `✅ Refresh token TTL set to ${formatDuration(refreshSeconds)}`,
        );
        showCurrent();
      }
      break;

    case 'reset':
      if (updateConfig(DEFAULT_TTL.access, DEFAULT_TTL.refresh)) {
        console.log('✅ TTL values reset to defaults');
        showCurrent();
      }
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.log('❌ Unknown command. Use "help" for usage information.');
      process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { readConfig, updateConfig, formatDuration, parseDuration };
