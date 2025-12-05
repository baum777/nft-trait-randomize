# Surge Bulls & Void Bears - NFT Metadata Generator

Ein deterministischer Generator für NFT-Metadaten basierend auf dem Hero's Journey Framework.

## Übersicht

Dieser Generator erstellt 333 einzigartige NFT-Metadaten für die "Surge Bulls & Void Bears" Kollektion. Jedes NFT repräsentiert eine Station auf der Hero's Journey und kombiniert:

- **12 Hero Journey Stationen**: Von "Ordinary World" bis "Return with the Elixir"
- **3 Archetypen**: Bull (Markt-Surge), Bear (Markt-Korrektur), Hybrid (Balance)
- **7 Trait-Layer**: Background, Body, Eyes, Headwear, Mouth, Accessory, Aura
- **4 Rarity-Kategorien**: CHAOS (7 Punkte), THRESHOLD (12 Punkte), ORDEAL_REWARD (21 Punkte), MYTHIC (42 Punkte)
- **7 Tier-Klassifizierungen**: Common, Uncommon, Rare, Epic, Legendary, Mythic, Divine

## Features

### ✨ Determinismus
- Gleicher Seed = identische Kollektion
- Perfekt für reproduzierbare Generierungen
- Ideal für Testing und Auditing

### 📊 Statistiken
- **333 NFTs** total
- **1 Hybrid** NFT (bei Station 8: The Ordeal)
- **166 Bulls** und **166 Bears**
- Score-Bereich: 7-294 Punkte
- Tier-Verteilung basiert auf natürlicher Trait-Verteilung

### 🎨 Trait-System
Jedes NFT hat 7 Layer mit je 9 möglichen Traits:

| Layer | Traits | Beispiele |
|-------|---------|-----------|
| Background | 9 | Cosmic Void (MYTHIC), Golden Sunrise (ORDEAL_REWARD) |
| Body | 9 | Diamond Bull (MYTHIC), Gold Bull (ORDEAL_REWARD) |
| Eyes | 9 | Cosmic Vision (MYTHIC), Laser Eyes (ORDEAL_REWARD) |
| Headwear | 9 | Crown of the Cosmos (MYTHIC), Champion's Laurel |
| Mouth | 9 | Cosmic Breath (MYTHIC), Dragon Fire (ORDEAL_REWARD) |
| Accessory | 9 | Infinity Amulet (MYTHIC), Sword of Victory |
| Aura | 9 | Divine Radiance (MYTHIC), Phoenix Flame |

### 🏆 Tier-System

| Tier | Name | Score-Bereich | Beschreibung |
|------|------|---------------|--------------|
| 1 | Common | 7-49 | Basis-Traits |
| 2 | Uncommon | 50-63 | Leicht erhöht |
| 3 | Rare | 64-77 | Selten |
| 4 | Epic | 78-98 | Episch |
| 5 | Legendary | 99-140 | Legendär |
| 6 | Mythic | 141-210 | Mythisch |
| 7 | Divine | 211-294 | Göttlich |

## Installation

```bash
# Dependencies installieren
npm install
```

## Usage

### Generator ausführen

```bash
# Generiere 333 NFTs mit Standard-Seed
npm run meta:generate

# Mit Custom Seed
SEED="my-custom-seed" npm run meta:generate
```

Output: `tools/meta-gen/out/metadata/001.json` bis `333.json`

### Bildgenerierung

Der Generator unterstützt automatisches Layer-basiertes Compositing:

```bash
# 1. Erstelle Placeholder-Assets für Tests
npm run meta:placeholders

# 2. Generiere Bilder aus Metadaten
npm run meta:images

# 3. Alles in einem Schritt (Metadaten + Bilder)
npm run meta:all
```

**Asset-Struktur:**
```
tools/meta-gen/assets/
  /background/
    red-crashing-candles.png
    ordinary-world-apartment.png
    ...
  /body/
    skinny-shaking-newbie.png
    couch-potato-degen.png
    ...
  /eyes/, /headwear/, /mouth/, /accessory/, /aura/
```

**Anforderungen an Assets:**
- Gleiche Canvas-Größe (empfohlen: 1024×1024px)
- PNG mit transparentem Hintergrund
- Dateinamen automatisch aus Trait-Namen generiert (oder manuell in Config definiert)

**Layer-Reihenfolge (Bottom → Top):**
1. Background
2. Body
3. Headwear
4. Eyes
5. Mouth
6. Accessory
7. Aura

Output: `tools/meta-gen/out/images/1.png` bis `333.png`

### Tests ausführen

```bash
# Alle Tests ausführen
npm run meta:test

# Tests im Watch-Mode
npm run meta:test:watch
```

### Test-Coverage

✅ **53 Tests** in 9 Kategorien:

**Metadata Generator (36 Tests):**
1. **Config Integrity**: Validierung der Konfiguration
2. **Station Distribution**: Prüfung der 333 NFT-Verteilung
3. **PRNG Determinism**: Deterministischer Zufallsgenerator
4. **Blueprint Generation**: NFT-Blueprint-Generierung
5. **NFT Generation**: Vollständige NFT-Generierung
6. **Score & Tier Mapping**: Score-Berechnung und Tier-Zuordnung
7. **Metaplex JSON**: Metaplex-Metadaten-Format

**Image Generator (17 Tests):**
8. **Asset Resolution**: Trait-zu-Asset-Mapping
9. **Image Compositing**: Layer-Überlagerung und PNG-Generierung

## Projektstruktur

```
nft-trait-randomize/
├── tools/
│   └── meta-gen/
│       ├── generator.ts                    # Metadata-Generator
│       ├── image-generator.ts              # Bild-Generator (Layer-Compositing)
│       ├── create-placeholder-assets.ts    # Placeholder-Asset-Generator
│       ├── types.ts                        # TypeScript Typen
│       ├── metaagen-config.json            # Kollektion-Konfiguration
│       ├── station-distribution.ts         # Stations-Verteilung
│       ├── assets/                         # Layer-Assets (PNG)
│       │   ├── background/
│       │   ├── body/
│       │   ├── eyes/
│       │   ├── headwear/
│       │   ├── mouth/
│       │   ├── accessory/
│       │   └── aura/
│       ├── test/
│       │   ├── generator.test.ts           # Metadata-Tests
│       │   └── image-generator.test.ts     # Image-Tests
│       └── out/
│           ├── metadata/                   # Generierte JSON-Metadaten
│           └── images/                     # Generierte PNG-Bilder
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Konfiguration

### metaagen-config.json

Die zentrale Konfigurationsdatei definiert:

- **Collection Info**: Name, Symbol, Description, Creator Address
- **Layers**: 7 Layer mit je 9 Traits
- **Scoring**: Punktwerte für Rarity-Kategorien
- **Tier Thresholds**: Score-Bereiche für Tiers
- **Hero Journey Stations**: 12 Stationen mit Namen

### station-distribution.ts

Definiert die Verteilung der NFTs:

```typescript
export const STATION_DISTRIBUTION: StationAllocation[] = [
  { stationId: 1, count: 28, bullRatio: 0.5, bearRatio: 0.5 },
  { stationId: 2, count: 28, bullRatio: 0.5, bearRatio: 0.5 },
  // ... weitere Stationen
  { stationId: 8, count: 29, bullRatio: 0.48, bearRatio: 0.48, hybridCount: 1 },
  // ...
];
```

## Metaplex JSON Format

Jedes generierte JSON folgt dem Metaplex-Standard:

```json
{
  "name": "Surge Bulls & Void Bears #001 – Station 8: The Ordeal",
  "symbol": "SBVB",
  "description": "...",
  "image": "ipfs://QmPlaceholder/1.png",
  "attributes": [
    { "trait_type": "Station", "value": 8 },
    { "trait_type": "Archetype", "value": "Bull" },
    { "trait_type": "Tier", "value": "Legendary" },
    { "trait_type": "Tier Score", "value": 113 },
    { "trait_type": "Background", "value": "Ocean Depths", "category": "THRESHOLD", "score": 12 },
    ...
  ],
  "properties": {
    "category": "image",
    "files": [{ "uri": "1.png", "type": "image/png" }],
    "creators": [{ "address": "YourSolanaAddressHere", "share": 100 }]
  }
}
```

## Technische Details

### PRNG (Pseudo-Random Number Generator)

Der Generator verwendet einen Linear Congruential Generator (LCG) für deterministische Zufallszahlen:

```typescript
function createRng(seed: string): () => number {
  let s = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
```

### Trait-Selektion

Traits werden zufällig aus jedem Layer ausgewählt. Die Score-Berechnung erfolgt basierend auf der Trait-Kategorie:

```typescript
totalScore = Σ(trait.score) für alle 7 Layers
```

### Inscription Tags

Jedes NFT erhält ein einzigartiges 4-Zeichen Tag (z.B. "THKW", "LGP5"):
- Alphabet: A-Z (ohne I, O) + 2-9 (ohne 0, 1)
- Deterministisch basierend auf RNG

## Development

### TypeScript

Das Projekt verwendet TypeScript mit strikten Typen:

```bash
# Type-Checking
npx tsc --noEmit
```

### Testing

```bash
# Watch-Mode für Test-Driven Development
npm run meta:test:watch
```

### Debugging

```bash
# Generator mit Debug-Output
node --inspect node_modules/.bin/tsx tools/meta-gen/generator.ts
```

## Anpassungen

### Trait-Kategorien ändern

Bearbeite `metaagen-config.json`:

```json
{
  "scoring": {
    "categories": {
      "CHAOS": 7,
      "THRESHOLD": 12,
      "ORDEAL_REWARD": 21,
      "MYTHIC": 42
    }
  }
}
```

### Stations-Verteilung anpassen

Bearbeite `station-distribution.ts`:

```typescript
export const STATION_DISTRIBUTION: StationAllocation[] = [
  { stationId: 1, count: 30, bullRatio: 0.6, bearRatio: 0.4 }, // Mehr Bulls
  // ... Wichtig: Summe muss 333 ergeben!
];
```

### Neue Traits hinzufügen

1. Bearbeite `metaagen-config.json`
2. Füge neue Traits zu einem Layer hinzu
3. Stelle sicher, dass jeder Layer genau 9 Traits hat

## License

MIT

## Credits

Entwickelt für die "Surge Bulls & Void Bears" NFT-Kollektion.
