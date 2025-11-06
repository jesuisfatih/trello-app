/**
 * Test environment variables are properly set
 * Run: node scripts/test-env.js
 */

const requiredVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'SHOPIFY_APP_URL',
  'TRELLO_API_KEY',
  'TRELLO_API_SECRET',
  'DATABASE_URL',
  'CADDY_DOMAIN',
  'CADDY_ACME_EMAIL',
];

const optionalVars = [
  'SHOPIFY_SCOPES',
  'TRELLO_DEFAULT_SCOPES',
  'NODE_ENV',
];

console.log('🔍 Checking environment variables...\n');

let missingCount = 0;
let warnings = 0;

// Check required variables
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.error(`❌ MISSING: ${varName}`);
    missingCount++;
  } else {
    // Mask sensitive values
    const masked = value.length > 10 ? value.substring(0, 10) + '...' : '***';
    console.log(`✅ ${varName}: ${masked}`);
  }
});

console.log('\n📋 Optional variables:');
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.warn(`⚠️  NOT SET: ${varName} (using defaults)`);
    warnings++;
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

console.log('\n' + '='.repeat(50));

if (missingCount > 0) {
  console.error(`\n❌ ${missingCount} required variable(s) missing!`);
  console.error('Please check your .env file.\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} optional variable(s) not set (using defaults)`);
  }
  console.log('');
  process.exit(0);
}

