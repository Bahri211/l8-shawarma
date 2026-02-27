// api/autocomplete.js — Vercel Serverless Function
// Google Places Autocomplete proxy — Horsens only, with house numbers

const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { input } = req.body;
  if (!input || input.length < 2)
    return res.status(400).json({ error: 'Input too short.' });

  const KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!KEY)
    return res.status(500).json({ error: 'API key not configured.' });

  try {
    // Always append Horsens so results are local
    // But keep original input so house numbers work (e.g. "Thorsgade 5")
    const searchInput = input.toLowerCase().includes('horsens')
      ? input
      : input + ' Horsens';

    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
      + '?input=' + encodeURIComponent(searchInput)
      + '&components=country:dk'
      + '&location=55.8611,9.8467'
      + '&radius=8000'
      + '&strictbounds=true'
      + '&language=da'
      + '&types=address'
      + '&key=' + KEY;

    const data = await fetchJSON(url);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API status:', data.status, data.error_message);
      return res.status(500).json({ error: 'Google API error: ' + data.status });
    }

    const suggestions = (data.predictions || [])
      .filter(p => p.description.toLowerCase().includes('horsens'))
      .map(p => ({
        // Clean up — remove ", Danmark" suffix for cleaner display
        description: p.description
          .replace(', Danmark', '')
          .replace(', Denmark', ''),
        placeId: p.place_id
      }));

    res.json({ suggestions });

  } catch (err) {
    console.error('Autocomplete error:', err);
    res.status(500).json({ error: 'Autocomplete failed.' });
  }
};