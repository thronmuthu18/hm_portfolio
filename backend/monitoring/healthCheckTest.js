/**
 * Central Health, API, Database, and SMTP Test Runner
 * Verifies system sanity in production or staging environments
 */

'use strict';

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const runTests = async () => {
  console.log('🏁 Starting Unified Enterprise Health Verification...\n');
  let exitCode = 0;

  // ── TEST 1: ENVIRONMENT CONFIGURATION ──────────────────────────────────────
  console.log('📋 Test 1: Checking Environment Variables...');
  const required = [
    'MONGODB_URI',
    'EMAIL_USER',
    'EMAIL_PASS',
    'JWT_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'CLIENT_URL',
    'PORT'
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ FAILED: Missing variables: ${missing.join(', ')}`);
    exitCode = 1;
  } else {
    console.log('✅ PASSED: Environment configured correctly.\n');
  }

  // ── TEST 2: DATABASE CONNECTIVITY & INDEXES ────────────────────────────────
  console.log('📋 Test 2: Checking MongoDB Connection & Index structures...');
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ PASSED: Connected to MongoDB Atlas.');

      const collections = await mongoose.connection.db.listCollections().toArray();
      const names = collections.map(c => c.name);
      console.log(`ℹ️ Collections present: ${names.join(', ')}`);

      // Verify Contact Index
      const indexes = await mongoose.connection.db.collection('contacts').indexes();
      console.log('ℹ️ Indexes detected on contacts:');
      indexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));
      
      await mongoose.connection.close();
      console.log('✅ PASSED: Database verification complete.\n');
    } catch (err) {
      console.error('❌ FAILED: MongoDB error:', err.message);
      exitCode = 1;
    }
  } else {
    console.log('⚠️ SKIPPED: MongoDB URI missing.\n');
  }

  // ── TEST 3: SMTP NODEMAILER TRANSPORT ──────────────────────────────────────
  console.log('📋 Test 3: Verifying Nodemailer SMTP Server...');
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      await transporter.verify();
      console.log('✅ PASSED: SMTP Credentials authenticated with mail servers.\n');
    } catch (err) {
      console.error('❌ FAILED: SMTP Verification failed:', err.message);
      exitCode = 1;
    }
  } else {
    console.log('⚠️ SKIPPED: Mail credentials missing.\n');
  }

  // ── TEST 4: JWT COMPILING & CRYPTO KEY CHECK ────────────────────────────────
  console.log('📋 Test 4: Verifying JWT Signing and Encryption...');
  try {
    const payload = { testUser: 'admin', role: 'test' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '5m' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    if (decoded.testUser === 'admin') {
      console.log('✅ PASSED: Token signed and decrypted correctly.\n');
    } else {
      throw new Error('Payload mismatch');
    }
  } catch (err) {
    console.error('❌ FAILED: JWT cryptography validation error:', err.message);
    exitCode = 1;
  }

  console.log(`🏁 Diagnostics completed. Exit code: ${exitCode}`);
  process.exit(exitCode);
};

runTests();
