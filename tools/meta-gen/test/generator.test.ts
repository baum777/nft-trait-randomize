/**
 * Tests for the NFT Metadata Generator
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  loadConfig,
  createRng,
  buildNftBlueprints,
  buildGeneratedNft,
  buildMetadataJson,
  generateCollection,
} from "../generator";
import {
  STATION_DISTRIBUTION,
  validateStationDistribution,
  getArchetypeCounts,
} from "../station-distribution";
import type { MetaGenConfig, MetaplexMetadata } from "../types";

const CONFIG_PATH = path.join(__dirname, "..", "metaagen-config.json");
const TEST_OUTPUT_DIR = path.join(__dirname, "..", "out", "test-metadata");
const TEST_SEED = "test-seed-deterministic";

describe("Config Integrity", () => {
  let config: MetaGenConfig;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);
  });

  it("should load config successfully", () => {
    expect(config).toBeDefined();
    expect(config.collection).toBeDefined();
    expect(config.layers).toBeDefined();
    expect(config.scoring).toBeDefined();
    expect(config.hero_journey).toBeDefined();
  });

  it("should have exactly 7 layers", () => {
    expect(config.layers).toHaveLength(7);
  });

  it("should have exactly 9 traits per layer", () => {
    for (const layer of config.layers) {
      expect(layer.traits).toHaveLength(9);
      expect(layer.name).toBeTruthy();
      expect(layer.key).toBeTruthy();
    }
  });

  it("should have all required scoring categories", () => {
    const categories = config.scoring.categories;
    expect(categories.CHAOS).toBeDefined();
    expect(categories.THRESHOLD).toBeDefined();
    expect(categories.ORDEAL_REWARD).toBeDefined();
    expect(categories.MYTHIC).toBeDefined();

    // Verify ascending point values
    expect(categories.CHAOS).toBeLessThan(categories.THRESHOLD);
    expect(categories.THRESHOLD).toBeLessThan(categories.ORDEAL_REWARD);
    expect(categories.ORDEAL_REWARD).toBeLessThan(categories.MYTHIC);
  });

  it("should have exactly 7 tier thresholds", () => {
    expect(config.scoring.tier_thresholds).toHaveLength(7);

    // Verify tiers are sequential
    for (let i = 0; i < 7; i++) {
      expect(config.scoring.tier_thresholds[i].tier).toBe(i + 1);
    }
  });

  it("should have exactly 12 hero journey stations", () => {
    expect(config.hero_journey.stations).toHaveLength(12);

    // Verify stations are sequential
    for (let i = 0; i < 12; i++) {
      expect(config.hero_journey.stations[i].id).toBe(i + 1);
      expect(config.hero_journey.stations[i].name).toBeTruthy();
    }
  });

  it("should have valid layer keys", () => {
    const expectedKeys = [
      "background",
      "body",
      "eyes",
      "headwear",
      "mouth",
      "accessory",
      "aura",
    ];
    const actualKeys = config.layers.map((l) => l.key);

    expect(actualKeys).toEqual(expectedKeys);
  });

  it("should have valid trait categories", () => {
    const validCategories = ["CHAOS", "THRESHOLD", "ORDEAL_REWARD", "MYTHIC"];

    for (const layer of config.layers) {
      for (const trait of layer.traits) {
        expect(validCategories).toContain(trait.category);
      }
    }
  });
});

describe("Station Distribution Integrity", () => {
  it("should total exactly 333 NFTs", () => {
    const validation = validateStationDistribution();
    expect(validation.valid).toBe(true);
    expect(validation.total).toBe(333);
    expect(validation.errors).toHaveLength(0);
  });

  it("should have exactly 12 stations", () => {
    expect(STATION_DISTRIBUTION).toHaveLength(12);
  });

  it("should have valid archetype ratios", () => {
    for (const alloc of STATION_DISTRIBUTION) {
      const counts = getArchetypeCounts(alloc);
      const total = counts.bulls + counts.bears + counts.hybrids;
      expect(total).toBe(alloc.count);
    }
  });

  it("should have exactly 1 hybrid in the collection", () => {
    const totalHybrids = STATION_DISTRIBUTION.reduce(
      (sum, alloc) => sum + (alloc.hybridCount || 0),
      0
    );
    expect(totalHybrids).toBe(1);
  });

  it("should have station 8 contain the hybrid", () => {
    const station8 = STATION_DISTRIBUTION.find((s) => s.stationId === 8);
    expect(station8).toBeDefined();
    expect(station8!.hybridCount).toBe(1);
  });
});

describe("PRNG Determinism", () => {
  it("should produce the same sequence with the same seed", () => {
    const rng1 = createRng("test-seed");
    const rng2 = createRng("test-seed");

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it("should produce different sequences with different seeds", () => {
    const rng1 = createRng("seed-a");
    const rng2 = createRng("seed-b");

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).not.toEqual(seq2);
  });
});

describe("Blueprint Generation", () => {
  let config: MetaGenConfig;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);
  });

  it("should generate exactly 333 blueprints", () => {
    const rng = createRng(TEST_SEED);
    const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);

    expect(blueprints).toHaveLength(333);
  });

  it("should assign sequential IDs from 1 to 333", () => {
    const rng = createRng(TEST_SEED);
    const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);

    const ids = blueprints.map((bp) => bp.id).sort((a, b) => a - b);
    expect(ids[0]).toBe(1);
    expect(ids[332]).toBe(333);

    // Check no duplicates
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(333);
  });

  it("should be deterministic with same seed", () => {
    const rng1 = createRng(TEST_SEED);
    const rng2 = createRng(TEST_SEED);

    const bp1 = buildNftBlueprints(config, STATION_DISTRIBUTION, rng1);
    const bp2 = buildNftBlueprints(config, STATION_DISTRIBUTION, rng2);

    // Compare first 5 blueprints
    for (let i = 0; i < 5; i++) {
      expect(bp1[i].station.id).toBe(bp2[i].station.id);
      expect(bp1[i].archetype).toBe(bp2[i].archetype);
    }
  });
});

describe("NFT Generation", () => {
  let config: MetaGenConfig;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);
  });

  it("should generate NFT with all required properties", () => {
    const rng = createRng(TEST_SEED);
    const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);
    const nft = buildGeneratedNft(blueprints[0], config, rng, Date.now());

    expect(nft.id).toBeDefined();
    expect(nft.station).toBeDefined();
    expect(nft.archetype).toBeDefined();
    expect(nft.traits).toHaveLength(7);
    expect(nft.totalScore).toBeGreaterThan(0);
    expect(nft.tier).toBeDefined();
    expect(nft.inscriptionTag).toHaveLength(4);
    expect(nft.mintTimestamp).toBeGreaterThan(0);
  });

  it("should generate deterministic NFTs with same seed", () => {
    const rng1 = createRng(TEST_SEED);
    const rng2 = createRng(TEST_SEED);

    const bp1 = buildNftBlueprints(config, STATION_DISTRIBUTION, rng1);
    const bp2 = buildNftBlueprints(config, STATION_DISTRIBUTION, rng2);

    const nft1 = buildGeneratedNft(bp1[0], config, rng1, 1000);
    const nft2 = buildGeneratedNft(bp2[0], config, rng2, 1000);

    expect(nft1.totalScore).toBe(nft2.totalScore);
    expect(nft1.tier.tier).toBe(nft2.tier.tier);
    expect(nft1.inscriptionTag).toBe(nft2.inscriptionTag);

    for (let i = 0; i < 7; i++) {
      expect(nft1.traits[i].value).toBe(nft2.traits[i].value);
      expect(nft1.traits[i].score).toBe(nft2.traits[i].score);
    }
  });
});

describe("Score Range & Tier Mapping", () => {
  let config: MetaGenConfig;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);
  });

  it("should have scores between min and max tier thresholds", () => {
    const rng = createRng(TEST_SEED);
    const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);

    const minScore = config.scoring.tier_thresholds[0].min;
    const maxScore = config.scoring.tier_thresholds[6].max;

    // Test first 50 NFTs
    for (let i = 0; i < 50; i++) {
      const nft = buildGeneratedNft(blueprints[i], config, rng, Date.now());
      expect(nft.totalScore).toBeGreaterThanOrEqual(minScore);
      expect(nft.totalScore).toBeLessThanOrEqual(maxScore);
    }
  });

  it("should assign correct tier based on score", () => {
    const rng = createRng(TEST_SEED);
    const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);

    // Test first 50 NFTs
    for (let i = 0; i < 50; i++) {
      const nft = buildGeneratedNft(blueprints[i], config, rng, Date.now());
      const tier = nft.tier;

      expect(nft.totalScore).toBeGreaterThanOrEqual(tier.min);
      expect(nft.totalScore).toBeLessThanOrEqual(tier.max);
    }
  });

  it("should have score equal to sum of trait scores", () => {
    const rng = createRng(TEST_SEED);
    const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);

    const nft = buildGeneratedNft(blueprints[0], config, rng, Date.now());
    const sumOfTraitScores = nft.traits.reduce((sum, t) => sum + t.score, 0);

    expect(nft.totalScore).toBe(sumOfTraitScores);
  });

  it("should have minimum score of 7*CHAOS_SCORE (all CHAOS)", () => {
    // Minimum possible score: 7 layers × CHAOS points
    const minPossible = 7 * config.scoring.categories.CHAOS;
    expect(config.scoring.tier_thresholds[0].min).toBeLessThanOrEqual(minPossible);
  });

  it("should have maximum score of 7*MYTHIC_SCORE (all MYTHIC)", () => {
    // Maximum possible score: 7 layers × MYTHIC points
    const maxPossible = 7 * config.scoring.categories.MYTHIC;
    expect(config.scoring.tier_thresholds[6].max).toBeGreaterThanOrEqual(maxPossible);
  });
});

describe("Metaplex Metadata JSON Shape", () => {
  let config: MetaGenConfig;
  let metadata: MetaplexMetadata;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);
    const rng = createRng(TEST_SEED);
    const blueprints = buildNftBlueprints(config, STATION_DISTRIBUTION, rng);
    const nft = buildGeneratedNft(blueprints[0], config, rng, Date.now());
    metadata = buildMetadataJson(nft, config);
  });

  it("should have required top-level fields", () => {
    expect(metadata.name).toBeTruthy();
    expect(metadata.symbol).toBe(config.collection.symbol);
    expect(metadata.description).toBeTruthy();
    expect(metadata.seller_fee_basis_points).toBe(500);
    expect(metadata.image).toContain("ipfs://");
    expect(metadata.external_url).toBeTruthy();
  });

  it("should have collection info", () => {
    expect(metadata.collection).toBeDefined();
    expect(metadata.collection.name).toBe(config.collection.name);
    expect(metadata.collection.family).toBe(config.collection.family);
  });

  it("should have properties section", () => {
    expect(metadata.properties).toBeDefined();
    expect(metadata.properties.category).toBe("image");
    expect(metadata.properties.files).toHaveLength(1);
    expect(metadata.properties.creators).toHaveLength(1);
    expect(metadata.properties.creators[0].share).toBe(100);
  });

  it("should have all required attributes", () => {
    expect(metadata.attributes).toBeDefined();
    expect(metadata.attributes.length).toBeGreaterThan(0);

    const attrTypes = metadata.attributes.map((a) => a.trait_type);

    // Core attributes
    expect(attrTypes).toContain("Station");
    expect(attrTypes).toContain("Station Name");
    expect(attrTypes).toContain("Archetype");
    expect(attrTypes).toContain("Tier");
    expect(attrTypes).toContain("Tier Score");
    expect(attrTypes).toContain("Hero Journey Stage");
    expect(attrTypes).toContain("Hero Journey Progress");
    expect(attrTypes).toContain("Inscription Tag");
    expect(attrTypes).toContain("Mint Timestamp");

    // Layer traits
    expect(attrTypes).toContain("Background");
    expect(attrTypes).toContain("Body");
    expect(attrTypes).toContain("Eyes");
    expect(attrTypes).toContain("Headwear");
    expect(attrTypes).toContain("Mouth");
    expect(attrTypes).toContain("Accessory");
    expect(attrTypes).toContain("Aura");
  });

  it("should have layer traits with category and score", () => {
    const layerTraits = metadata.attributes.filter((a) =>
      ["Background", "Body", "Eyes", "Headwear", "Mouth", "Accessory", "Aura"].includes(
        a.trait_type
      )
    );

    expect(layerTraits).toHaveLength(7);

    for (const trait of layerTraits) {
      expect(trait.category).toBeDefined();
      expect(trait.score).toBeDefined();
      expect(trait.score).toBeGreaterThan(0);
    }
  });

  it("should have 4-character inscription tag", () => {
    const inscriptionAttr = metadata.attributes.find(
      (a) => a.trait_type === "Inscription Tag"
    );
    expect(inscriptionAttr).toBeDefined();
    expect(typeof inscriptionAttr!.value).toBe("string");
    expect((inscriptionAttr!.value as string).length).toBe(4);
  });

  it("should have station ID between 1 and 12", () => {
    const stationAttr = metadata.attributes.find((a) => a.trait_type === "Station");
    expect(stationAttr).toBeDefined();
    expect(stationAttr!.value).toBeGreaterThanOrEqual(1);
    expect(stationAttr!.value).toBeLessThanOrEqual(12);
  });

  it("should have valid archetype", () => {
    const archetypeAttr = metadata.attributes.find((a) => a.trait_type === "Archetype");
    expect(archetypeAttr).toBeDefined();
    expect(["Bull", "Bear", "Hybrid"]).toContain(archetypeAttr!.value);
  });
});

describe("Full Collection Generation", () => {
  it("should generate all 333 metadata files", async () => {
    // Clean test output directory
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }

    await generateCollection(CONFIG_PATH, TEST_OUTPUT_DIR, TEST_SEED);

    // Check files exist
    const files = fs.readdirSync(TEST_OUTPUT_DIR);
    expect(files).toHaveLength(333);

    // Check first and last file
    expect(files).toContain("001.json");
    expect(files).toContain("333.json");
  });

  it("should generate valid JSON for each file", async () => {
    // Test first 10 files
    for (let i = 1; i <= 10; i++) {
      const idStr = String(i).padStart(3, "0");
      const filePath = path.join(TEST_OUTPUT_DIR, `${idStr}.json`);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(content);

      expect(json.name).toBeTruthy();
      expect(json.attributes).toBeDefined();
      expect(Array.isArray(json.attributes)).toBe(true);
    }
  });

  it("should be deterministic across multiple runs", async () => {
    const outputDir1 = path.join(__dirname, "..", "out", "test-run-1");
    const outputDir2 = path.join(__dirname, "..", "out", "test-run-2");

    // Clean directories
    [outputDir1, outputDir2].forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }
    });

    // Generate twice with same seed
    await generateCollection(CONFIG_PATH, outputDir1, "determinism-test");
    await generateCollection(CONFIG_PATH, outputDir2, "determinism-test");

    // Compare first 5 files
    for (let i = 1; i <= 5; i++) {
      const idStr = String(i).padStart(3, "0");
      const file1 = fs.readFileSync(path.join(outputDir1, `${idStr}.json`), "utf-8");
      const file2 = fs.readFileSync(path.join(outputDir2, `${idStr}.json`), "utf-8");

      const json1 = JSON.parse(file1);
      const json2 = JSON.parse(file2);

      // Compare traits and scores (ignore timestamps)
      expect(json1.name).toBe(json2.name);
      expect(json1.attributes.length).toBe(json2.attributes.length);

      const traits1 = json1.attributes.filter((a: any) =>
        ["Background", "Body", "Eyes", "Headwear", "Mouth", "Accessory", "Aura"].includes(
          a.trait_type
        )
      );
      const traits2 = json2.attributes.filter((a: any) =>
        ["Background", "Body", "Eyes", "Headwear", "Mouth", "Accessory", "Aura"].includes(
          a.trait_type
        )
      );

      expect(traits1).toEqual(traits2);
    }
  });
});
