// api/autocomplete.js — Vercel Serverless Function
// Shows street + house numbers when user types a street name

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
    const trimmed = input.trim();

    // Check if input already contains a number (e.g. "Thorsgade 5")
    const hasNumber = /\d/.test(trimmed);

    if (hasNumber) {
      // User typed a number — search normally for exact address
      const searchInput = trimmed.toLowerCase().includes('horsens')
        ? trimmed : trimmed + ' Horsens';

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
        return res.status(500).json({ error: 'Google API error: ' + data.status });
      }

      const suggestions = (data.predictions || [])
        .filter(p => p.description.toLowerCase().includes('horsens'))
        .map(p => ({
          description: p.description
            .replace(', Danmark', '')
            .replace(', Denmark', ''),
          placeId: p.place_id
        }));

      return res.json({ suggestions });

    } else {
      // User typed only street name — generate numbered suggestions
      // First verify the street exists in Horsens
      const verifyUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
        + '?input=' + encodeURIComponent(trimmed + ' Horsens')
        + '&components=country:dk'
        + '&location=55.8611,9.8467'
        + '&radius=8000'
        + '&strictbounds=true'
        + '&language=da'
        + '&types=address'
        + '&key=' + KEY;

      const verifyData = await fetchJSON(verifyUrl);

      // Extract the clean street name from first result
      let streetName = trimmed;
      if (verifyData.predictions && verifyData.predictions.length > 0) {
        const firstDesc = verifyData.predictions[0].description;
        // Extract street name part (before the comma)
        const parts = firstDesc.split(',');
        if (parts.length > 0) {
          // Remove trailing number from street name if present
          streetName = parts[0].replace(/\s+\d+\s*$/, '').trim();
        }
      }

      // Generate numbers 1–30 as suggestions
      const numbers = [];
      for (let i = 1; i <= 30; i++) {
        numbers.push({
          description: streetName + ' ' + i + ', 8700 Horsens',
          placeId: null
        });
      }

      return res.json({ suggestions: numbers });
    }

  } catch (err) {
    console.error('Autocomplete error:', err);
    res.status(500).json({ error: 'Autocomplete failed.' });
  }
};