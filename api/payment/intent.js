// api/payment/intent.js — Vercel Serverless Function
// Creates a Stripe PaymentIntent so the frontend can confirm card payment

const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount, currency = 'dkk' } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Invalid order amount.' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100), // convert to øre (smallest DKK unit)
      currency,
      metadata: { business: 'Scandinavian Stenovns Pizza' }
    });

    res.json({
      clientSecret:    paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Payment setup failed. Please try again.' });
  }
};