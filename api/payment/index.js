// api/payment/index.js — Vercel Serverless Function
// Handles final order confirmation after payment is processed

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { delivery, items, totalAmount, paymentIntentId, paymentMethod } = req.body;

    if (!delivery || !items || !totalAmount)
      return res.status(400).json({ error: 'Missing order information.' });

    const order = {
      orderId:           `SP-${Date.now()}`,
      delivery,
      items,
      total:             totalAmount,
      paymentMethod:     paymentMethod || 'card',
      paymentIntentId:   paymentIntentId || null,
      status:            'confirmed',
      createdAt:         new Date().toISOString(),
      estimatedDelivery: '25-40 minutes'
    };

    console.log('🍕 New order:', order);

    // TODO: Save order to database (MongoDB / Supabase etc.)

    res.json({ message: 'Order placed successfully!', order });

  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Order failed. Please try again or call us.' });
  }
};