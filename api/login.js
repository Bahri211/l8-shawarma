// api/login.js — Vercel Serverless Function
// Handles user login

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    // TODO: Look up user in your database by email
    // TODO: Compare hashed password with bcrypt:
    //   const bcrypt = require('bcrypt');
    //   const match = await bcrypt.compare(password, user.hashedPassword);
    //   if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    // TODO: Generate a JWT token for session management:
    //   const jwt = require('jsonwebtoken');
    //   const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // ---- PLACEHOLDER (remove once database is connected) ----
    if (email === 'test@pizza.dk' && password === 'test123') {
      return res.json({
        message: 'Login successful.',
        user: { id: 'demo-user', name: 'Demo User', email }
      });
    }
    return res.status(401).json({ error: 'Invalid email or password.' });
    // ----------------------------------------------------------

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};