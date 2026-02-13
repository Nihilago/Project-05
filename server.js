// server.js

const express = require('express');
const path = require('path');
const catalogus = require('./catalogus.js'); // catalog data

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory cart: { itemId: { item, quantity, size } }
let cart = {};

// Build cart summary for frontend
function getCartSummary() {
  const items = [];
  let itemCount = 0;
  let subtotal = 0;

  for (const itemId in cart) {
    const entry = cart[itemId];
    const regelTotaal = entry.item.prijs * entry.quantity;

    items.push({
      itemId: entry.item.id,
      naam: entry.item.naam,
      merk: entry.item.merk,
      prijs: entry.item.prijs,
      aantal: entry.quantity,
      regelTotaal,
      afbeelding: entry.item.afbeelding,
      size: entry.size || null,
    });

    itemCount += entry.quantity;
    subtotal += regelTotaal;
  }

  const shipping = itemCount > 0 ? 7 : 0;
  const grandTotal = subtotal + shipping;

  return {
    items,
    itemCount,
    subtotal,
    shipping,
    total: grandTotal,
  };
}

// ------- CATALOGUS -------

// GET /api/clothes
app.get('/api/clothes', (req, res) => {
  res.json(catalogus);
});

// (optional) POST /api/clothes
app.post('/api/clothes', (req, res) => {
  const { id, naam, merk, prijs, afbeelding, kleur, maten, tag, gender } = req.body;

  if (!id || !naam || !merk || !prijs || !afbeelding) {
    return res
      .status(400)
      .json({ error: 'id, naam, merk, prijs en afbeelding zijn verplicht' });
  }

  if (catalogus.find((item) => item.id === id)) {
    return res.status(400).json({ error: 'Item met deze id bestaat al' });
  }

  const nieuwItem = {
    id,
    naam,
    merk,
    prijs: Number(prijs),
    afbeelding,
    kleur: kleur || '',
    maten: Array.isArray(maten) ? maten : [],
    tag: tag || [],
    gender: gender || 'unisex',
  };

  catalogus.push(nieuwItem);

  res.status(201).json({
    bericht: 'Artikel toegevoegd aan catalogus',
    item: nieuwItem,
    catalogusLengte: catalogus.length,
  });
});

// ------- CART -------

// GET /api/cart
app.get('/api/cart', (req, res) => {
  res.json(getCartSummary());
});

// POST /api/cart (add item)
app.post('/api/cart', (req, res) => {
  const { itemId, quantity, size } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: 'itemId is verplicht' });
  }

  const qty = quantity && quantity > 0 ? Number(quantity) : 1;
  const item = catalogus.find((c) => c.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Item niet gevonden' });
  }

  if (!cart[itemId]) {
    cart[itemId] = { item, quantity: 0, size: size || null };
  }

  cart[itemId].quantity += qty;
  if (size) {
    cart[itemId].size = size;
  }

  res.json({
    bericht: 'Artikel toegevoegd aan mand',
    mand: getCartSummary(),
  });
});

// PATCH /api/cart/:itemId (quantity + / -)
app.patch('/api/cart/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { delta } = req.body; // +1 or -1

  if (typeof delta !== 'number') {
    return res.status(400).json({ error: 'delta (number) is verplicht' });
  }

  const entry = cart[itemId];
  if (!entry) {
    return res.status(404).json({ error: 'Item staat niet in de mand' });
  }

  entry.quantity += delta;
  if (entry.quantity <= 0) {
    delete cart[itemId];
  }

  res.json({
    bericht: 'Winkelmand bijgewerkt',
    mand: getCartSummary(),
  });
});

// DELETE /api/cart/:itemId
app.delete('/api/cart/:itemId', (req, res) => {
  const { itemId } = req.params;

  if (!cart[itemId]) {
    return res.status(404).json({ error: 'Item staat niet in de mand' });
  }

  delete cart[itemId];

  res.json({
    bericht: 'Artikel volledig verwijderd uit mand',
    mand: getCartSummary(),
  });
});

// 404 handler – keep this LAST middleware
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
