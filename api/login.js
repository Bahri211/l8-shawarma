// api/login.js — Vercel Serverless Function
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

if (!global._users) global._users = [];
const users = global._users;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const user = users.find(u => u.email === email.toLowerCase().trim());
  if (!user)
    return res.status(401).json({ error: 'No account found with that email.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ error: 'Incorrect password.' });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'l8shawarma_secret',
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful!',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
};