// api/register.js — Vercel Serverless Function
// Handles new user registration

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Invalid email address.' });

    // TODO: Check if user already exists in your database
    // TODO: Hash password with bcrypt before storing
    // Example with bcrypt:
    //   const bcrypt = require('bcrypt');
    //   const hashedPassword = await bcrypt.hash(password, 10);

    // TODO: Save user to database (MongoDB / Supabase / PostgreSQL etc.)
    const newUser = {
      id:        `user-${Date.now()}`,
      name,
      email,
      phone:     phone || null,
      createdAt: new Date().toISOString()
    };

    console.log('👤 New user registered:', newUser.email);

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};