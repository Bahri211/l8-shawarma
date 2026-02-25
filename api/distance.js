// api/distance.js — Vercel Serverless Function
// Proxies Google Maps Geocoding + Distance Matrix API
// Key stays server-side — never exposed in the browser

const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Invalid JSON from Google API')); }
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

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address is required.' });

  const KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'Google Maps API key not configured on server.' });

  const RESTAURANT = 'Bjerrevej 73, 8700 Horsens, Denmark';

  try {
    // Step 1: Geocode the customer address
    const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json'
      + '?address=' + encodeURIComponent(address + ', Denmark')
      + '&key=' + KEY;

    const geoData = await fetchJSON(geoUrl);

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: 'Adressen blev ikke fundet. Prøv igen med vejnavn og nummer.' });
    }

    const formattedAddress = geoData.results[0].formatted_address;
    const lat = geoData.results[0].geometry.location.lat;
    const lng = geoData.results[0].geometry.location.lng;

    // Step 2: Distance Matrix — restaurant to customer
    const distUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'
      + '?origins=' + encodeURIComponent(RESTAURANT)
      + '&destinations=' + lat + ',' + lng
      + '&units=metric'
      + '&key=' + KEY;

    const distData = await fetchJSON(distUrl);
    const element = distData.rows && distData.rows[0] && distData.rows[0].elements && distData.rows[0].elements[0];

    if (!element || element.status !== 'OK') {
      return res.status(400).json({ error: 'Kunne ikke beregne afstand til denne adresse.' });
    }

    const distanceM   = element.distance.value;
    const distanceKm  = distanceM / 1000;
    const durationMin = Math.ceil(element.duration.value / 60);

    // Delivery pricing tiers
    var fee, minOrder, freeAt, canDeliver;
    if (distanceKm <= 3) {
      fee = 29; minOrder = 100; freeAt = 249; canDeliver = true;
    } else if (distanceKm <= 6) {
      fee = 39; minOrder = 129; freeAt = 299; canDeliver = true;
    } else if (distanceKm <= 10) {
      fee = 49; minOrder = 149; freeAt = 349; canDeliver = true;
    } else if (distanceKm <= 15) {
      fee = 69; minOrder = 179; freeAt = 399; canDeliver = true;
    } else {
      canDeliver = false;
    }

    var response = {
      canDeliver: canDeliver,
      formattedAddress: formattedAddress,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      distanceText: distanceKm.toFixed(1) + ' km',
      durationMin: durationMin,
      durationText: durationMin + ' min'
    };
    if (canDeliver) {
      response.fee = fee;
      response.minOrder = minOrder;
      response.freeAt = freeAt;
    }

    res.json(response);

  } catch (err) {
    console.error('Distance API error:', err);
    res.status(500).json({ error: 'Noget gik galt. Prøv venligst igen.' });
  }
};