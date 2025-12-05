/**
 * Surge Bulls & Void Bears NFT Metadata Generator
 *
 * Generates 333 deterministic NFT metadata files based on:
 * - Hero Journey stations (12 stages)
 * - Archetypal forces (Bull, Bear, Hybrid)
 * - Multi-layered trait system (7 layers)
 * - Rarity scoring and tier classification
 */

import * as fs from "fs";
import * as path from "path";
import type {
  MetaGenConfig,
  LayerConfig,
  TraitConfig,
  GeneratedTrait,
  GeneratedNft,
  NftBlueprint,
  TierThreshold,
  MetaplexMetadata,
  MetaplexAttribute,
} from "./types";
import {
  STATION_DISTRIBUTION,
  validateStationDistribution,
  getArchetypeCounts,
  type StationAllocation,
} from "./station-distribution";

// ============================================================================
// PRNG - Deterministic Random Number Generator
// ============================================================================

/**
 * Simple Linear Congruential Generator for deterministic randomness
 * Same seed will always produce the same sequence of random numbers
 */
export function createRng(seed: string): () => number {
  let s = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;

  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle algorithm with deterministic RNG
 */
export function shuffleInPlace<T>(array: T[], rng: () => number): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ============================================================================
// Config Loading & Validation
// ============================================================================

/**
 * Loads and validates the metaagen-config.json file
 */
export function loadConfig(configPath: string): MetaGenConfig {
  const content = fs.readFileSync(configPath, "utf-8");
  const config: MetaGenConfig = JSON.parse(content);

  // Validate basic structure
  if (!config.layers || config.layers.length !== 7) {
    throw new Error(`Expected 7 layers, got ${config.layers?.length || 0}`);
  }

  for (const layer of config.layers) {
    if (!layer.traits || layer.traits.length !== 9) {
      throw new Error(
        `Layer "${layer.name}" must have exactly 9 traits, got ${layer.traits?.length || 0}`
      );
    }
  }

  // Validate scoring categories
  const requiredCategories = ["CHAOS", "THRESHOLD", "ORDEAL_REWARD", "MYTHIC"];
  for (const cat of requiredCategories) {
    if (!(cat in config.scoring.categories)) {
      throw new Error(`Missing scoring category: ${cat}`);
    }
  }

  // Validate tier thresholds
  if (!config.scoring.tier_thresholds || config.scoring.tier_thresholds.length !== 7) {
    throw new Error(`Expected 7 tier thresholds`);
  }

  // Validate hero journey stations
  if (!config.hero_journey.stations || config.hero_journey.stations.length !== 12) {
    throw new Error(`Expected 12 hero journey stations`);
  }

  return config;
}

// ============================================================================
// Blueprint Generation (Station + Archetype Assignment)
// ============================================================================

/**
 * Builds NFT blueprints with assigned station and archetype
 * Returns exactly 333 blueprints in deterministic order
 */
export function buildNftBlueprints(
  config: MetaGenConfig,
  dist: StationAllocation[],
  rng: () => number
): NftBlueprint[] {
  const blueprints: NftBlueprint[] = [];
  let id = 1;

  for (const alloc of dist) {
    const station = config.hero_journey.stations.find((s) => s.id === alloc.stationId);
    if (!station) {
      throw new Error(`Unknown stationId ${alloc.stationId}`);
    }

    const counts = getArchetypeCounts(alloc);

    // Add Hybrids first (if any)
    for (let i = 0; i < counts.hybrids; i++) {
      blueprints.push({ id: id++, station, archetype: "Hybrid" });
    }

    // Add Bulls
    for (let i = 0; i < counts.bulls; i++) {
      blueprints.push({ id: id++, station, archetype: "Bull" });
    }

    // Add Bears
    for (let i = 0; i < counts.bears; i++) {
      blueprints.push({ id: id++, station, archetype: "Bear" });
    }
  }

  // Shuffle blueprints for variety while maintaining determinism
  shuffleInPlace(blueprints, rng);

  // Re-assign sequential IDs after shuffle
  blueprints.forEach((bp, idx) => {
    bp.id = idx + 1;
  });

  return blueprints;
}

// ============================================================================
// Trait Selection & Scoring
// ============================================================================

/**
 * Randomly selects a trait from a layer
 */
export function pickRandomTrait(layer: LayerConfig, rng: () => number): TraitConfig {
  const idx = Math.floor(rng() * layer.traits.length);
  return layer.traits[idx];
}

/**
 * Generates all 7 traits for an NFT
 */
export function generateTraitsForNft(
  config: MetaGenConfig,
  rng: () => number
): GeneratedTrait[] {
  return config.layers.map((layer) => {
    const trait = pickRandomTrait(layer, rng);
    const category = trait.category;
    const baseScore = config.scoring.categories[category];

    return {
      layerKey: layer.key,
      traitType: layer.name,
      value: trait.name,
      category,
      score: baseScore,
    };
  });
}

/**
 * Computes total score from all traits
 */
export function computeTotalScore(traits: GeneratedTrait[]): number {
  return traits.reduce((sum, t) => sum + t.score, 0);
}

/**
 * Determines the tier based on total score
 */
export function resolveTier(score: number, tiers: TierThreshold[]): TierThreshold {
  const tier = tiers.find((t) => score >= t.min && score <= t.max);
  if (!tier) {
    throw new Error(
      `Score ${score} outside tier thresholds (${tiers[0].min}-${tiers[tiers.length - 1].max})`
    );
  }
  return tier;
}

// ============================================================================
// Inscription Tag Generation
// ============================================================================

const INSCRIPTION_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars (I,O,0,1)

/**
 * Generates a deterministic 4-character inscription tag
 */
export function generateTag(rng: () => number): string {
  let tag = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * INSCRIPTION_CHARS.length);
    tag += INSCRIPTION_CHARS[idx];
  }
  return tag;
}

// ============================================================================
// NFT Generation
// ============================================================================

/**
 * Generates a complete NFT from a blueprint
 */
export function buildGeneratedNft(
  blueprint: NftBlueprint,
  config: MetaGenConfig,
  rng: () => number,
  mintTimestamp: number
): GeneratedNft {
  const traits = generateTraitsForNft(config, rng);
  const totalScore = computeTotalScore(traits);
  const tier = resolveTier(totalScore, config.scoring.tier_thresholds);
  const inscriptionTag = generateTag(rng);

  return {
    id: blueprint.id,
    station: blueprint.station,
    archetype: blueprint.archetype,
    traits,
    totalScore,
    tier,
    inscriptionTag,
    mintTimestamp,
  };
}

// ============================================================================
// Metaplex Metadata JSON Builder
// ============================================================================

/**
 * Pads an NFT ID to 3 digits (e.g., 1 -> "001")
 */
function pad3(id: number): string {
  return String(id).padStart(3, "0");
}

/**
 * Builds a Metaplex-compatible JSON metadata object
 */
export function buildMetadataJson(
  nft: GeneratedNft,
  config: MetaGenConfig
): MetaplexMetadata {
  const attrs: MetaplexAttribute[] = [
    {
      trait_type: "Station",
      display_type: "number",
      value: nft.station.id,
    },
    {
      trait_type: "Station Name",
      value: nft.station.name,
    },
    {
      trait_type: "Archetype",
      value: nft.archetype,
    },
    {
      trait_type: "Tier",
      value: nft.tier.name,
    },
    {
      trait_type: "Tier Score",
      display_type: "number",
      value: nft.totalScore,
    },
    {
      trait_type: "Hero Journey Stage",
      value: nft.station.name,
    },
    {
      trait_type: "Hero Journey Progress",
      display_type: "number",
      value: nft.station.id,
    },
    // Add all layer traits with category and score
    ...nft.traits.map((t) => ({
      trait_type: t.traitType,
      value: t.value,
      category: t.category,
      score: t.score,
    })),
    {
      trait_type: "Inscription Tag",
      value: nft.inscriptionTag,
    },
    {
      trait_type: "Mint Timestamp",
      display_type: "date",
      value: nft.mintTimestamp,
    },
  ];

  return {
    name: `${config.collection.name} #${pad3(nft.id)} – Station ${nft.station.id}: ${
      nft.station.name
    }`,
    symbol: config.collection.symbol,
    description: config.collection.description_base,
    seller_fee_basis_points: config.collection.seller_fee_basis_points,
    image: `ipfs://${config.collection.image_cid}/${nft.id}.png`,
    external_url: config.collection.external_url,
    collection: {
      name: config.collection.name,
      family: config.collection.family,
    },
    attributes: attrs,
    properties: {
      category: "image",
      files: [{ uri: `${nft.id}.png`, type: "image/png" }],
      creators: [
        {
          address: config.collection.creator_address,
          share: 100,
        },
      ],
    },
  };
}

// ============================================================================
// Main Generator Function
// ============================================================================

export async function generateCollection(
  configPath: string,
  outputDir: string,
  seed?: string
): Promise<void> {
  // Load and validate config
  console.log("Loading config from:", configPath);
  const config = loadConfig(configPath);

  // Validate station distribution
  console.log("Validating station distribution...");
  const validation = validateStationDistribution();
  if (!validation.valid) {
    throw new Error(
      `Station distribution validation failed:\n${validation.errors.join("\n")}`
    );
  }
  console.log(`✓ Station distribution valid (${validation.total} NFTs)`);

  // Initialize PRNG
  const rngSeed = seed || process.env.SEED || "surge-bulls-void-bears-genesis";
  console.log(`Initializing PRNG with seed: "${rngSeed}"`);
  const rng = createRng(rngSeed);

  // Generate blueprints
  console.log("Generating NFT blueprints...");
  const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);

  if (blueprints.length !== 333) {
    throw new Error(`Expected 333 blueprints, got ${blueprints.length}`);
  }
  console.log(`✓ Generated ${blueprints.length} blueprints`);

  // Set mint timestamp (same for all in this batch)
  const mintTimestamp = Date.now();

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Generate and write NFT metadata
  console.log("Generating NFT metadata files...");
  for (const bp of blueprints) {
    const nft = buildGeneratedNft(bp, config, rng, mintTimestamp);
    const meta = buildMetadataJson(nft, config);
    const idStr = pad3(nft.id);
    const outPath = path.join(outputDir, `${idStr}.json`);

    await fs.promises.writeFile(outPath, JSON.stringify(meta, null, 2), "utf-8");

    // Log progress every 50 NFTs
    if (nft.id % 50 === 0 || nft.id === 333) {
      console.log(`  Generated ${nft.id}/333...`);
    }
  }

  console.log(`\n✓ Successfully generated 333 NFT metadata files in: ${outputDir}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

// Check if this file is being run directly (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const configPath = path.join(__dirname, "metaagen-config.json");
  const outputDir = path.join(__dirname, "out", "metadata");

  generateCollection(configPath, outputDir)
    .then(() => {
      console.log("\n🎉 Generation complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Generation failed:");
      console.error(err);
      process.exit(1);
    });
}
