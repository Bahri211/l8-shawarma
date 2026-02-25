// api/register.js — Vercel Serverless Function
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// In-memory store (resets on cold start — fine for testing)
// For production swap with a real DB like MongoDB Atlas (free tier)
if (!global._users) global._users = [];
const users = global._users;

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password, phone } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });

  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const exists = users.find(u => u.email === email.toLowerCase());
  if (exists)
    return res.status(400).json({ error: 'An account with this email already exists.' });

  const hashed = await bcrypt.hash(password, 12);
  const user = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || '',
    password: hashed
  };
  users.push(user);

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'l8shawarma_secret',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'Account created successfully!',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
};