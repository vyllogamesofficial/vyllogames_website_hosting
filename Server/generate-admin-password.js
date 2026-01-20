/**
 * Super Admin Password Generator
 * 
 * Run this script to generate a bcrypt hash for your super admin password.
 * Then add the hash to your .env file as ADMIN_PASSWORD_HASH
 * 
 * Usage: node generate-admin-password.js YourSecurePassword123!
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('');
  console.log('🔐 Super Admin Password Generator');
  console.log('================================');
  console.log('');
  console.log('Usage: node generate-admin-password.js <your-password>');
  console.log('');
  console.log('Example: node generate-admin-password.js MySecure@Password123');
  console.log('');
  console.log('Then add the generated hash to your .env file:');
  console.log('ADMIN_PASSWORD_HASH=<generated-hash>');
  console.log('');
  process.exit(1);
}

// Validate password strength
const hasMinLength = password.length >= 8;
const hasUppercase = /[A-Z]/.test(password);
const hasLowercase = /[a-z]/.test(password);
const hasNumber = /\d/.test(password);
const hasSpecial = /[@$!%*?&]/.test(password);

if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
  console.log('');
  console.log('⚠️  Password does not meet security requirements:');
  console.log('');
  console.log(`  ${hasMinLength ? '✅' : '❌'} At least 8 characters`);
  console.log(`  ${hasUppercase ? '✅' : '❌'} One uppercase letter`);
  console.log(`  ${hasLowercase ? '✅' : '❌'} One lowercase letter`);
  console.log(`  ${hasNumber ? '✅' : '❌'} One number`);
  console.log(`  ${hasSpecial ? '✅' : '❌'} One special character (@$!%*?&)`);
  console.log('');
  process.exit(1);
}

// Generate hash with 12 salt rounds (high security)
const hash = bcrypt.hashSync(password, 12);

console.log('');
console.log('🔐 Super Admin Password Generated Successfully!');
console.log('================================================');
console.log('');
console.log('Add these to your .env file:');
console.log('');
console.log(`ADMIN_EMAIL=admin@yourdomain.com`);
console.log(`ADMIN_USERNAME=SuperAdmin`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('');
console.log('⚠️  IMPORTANT: Never commit your .env file to version control!');
console.log('');
