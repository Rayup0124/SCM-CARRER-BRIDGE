/**
 * One-time script to create an admin user in MongoDB.
 * Run from backend folder: node scripts/createAdmin.js
 *
 * Default credentials (change in code or use env):
 *   Email: admin@scm.uts.edu.my
 *   Password: admin123
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@scm.uts.edu.my';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'SCM Admin';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scm-career-bridge';

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  const db = mongoose.connection.db;
  const collection = db.collection('users');

  const existing = await collection.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    if (existing.role === 'admin') {
      console.log('Admin user already exists:', ADMIN_EMAIL);
      process.exit(0);
    }
    console.log('User exists but is not admin. Update role manually or use another email.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await collection.insertOne({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    password: hashed,
    role: 'admin',
    skills: [],
    resumeUrl: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Admin user created successfully.');
  console.log('  Email:', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
