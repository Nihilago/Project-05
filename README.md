# Modewinkel — Demo (Express.js + HTML)

Een minimale **Express.js** API voor een modewinkel, inclusief een eenvoudige **statische HTML-frontend**.

## Functionaliteiten
- Catalogus tonen
- Winkelmand tonen
- Item toevoegen via API

## Installatie & Starten
```bash
npm init -y
npm i express
node server.js
```
Open http://localhost:3000

## API-eindpunten
- `GET /api/clothes` — Lijst met kledingartikelen
- `GET /api/cart` — Haal winkelmand op
- `POST /api/cart` — Voeg artikel toe `{ itemId: string }`

> Let op: De winkelmand wordt in het geheugen bewaard en leeggemaakt bij herstart.

API-documentatie
1) GET /api/clothes — Lijst met kledingartikelen
Respons (voorbeeld):
```json

[
  {
    "id": "tshirt-001",
    "naam": "Klassiek T-shirt",
    "merk": "Acme",
    "prijs": 19.99,
    "afbeelding": "https://picsum.photos/seed/tshirt001/300/300",
    "kleur": "Wit",
    "maten": ["S", "M", "L", "XL"]
  }
  // ...
]
```

2) GET /api/cart — Haal winkelmand op (samenvatting)
Respons (voorbeeld):
```json
{
  "items": [
    {
      "itemId": "tshirt-001",
      "naam": "Klassiek T-shirt",
      "merk": "Acme",
      "prijs": 19.99,
      "aantal": 2,
      "regelTotaal": 39.98,
      "afbeelding": "https://picsum.photos/seed/tshirt001/300/300"
    }
  ],
  "itemCount": 2,
  "total": 39.98
}
```

3) POST /api/cart — Voeg item toe aan winkelmand
Body (JSON):
```json
{ "itemId": "tshirt-001", "quantity": 1 }
```

Respons (samenvatting na toevoegen):
```json
{
  "bericht": "Artikel toegevoegd aan mand",
  "mand": {
    "items": [ /* zie voorbeeld boven */ ],
    "itemCount": 3,
    "total": 59.97
  }
}
```