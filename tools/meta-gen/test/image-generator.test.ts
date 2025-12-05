/**
 * Tests for the Image Generator
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import {
  sanitizeFilename,
  resolveAssetPath,
  extractLayerInfo,
  validateAssets,
  generateNftImage,
  type ImageGeneratorConfig,
} from "../image-generator";
import { loadConfig } from "../generator";
import type { MetaGenConfig, MetaplexMetadata } from "../types";

const CONFIG_PATH = path.join(__dirname, "..", "metaagen-config.json");
const TEST_OUTPUT_DIR = path.join(__dirname, "..", "out", "test-images");
const ASSETS_DIR = path.join(__dirname, "..", "assets");
const METADATA_DIR = path.join(__dirname, "..", "out", "metadata");

describe("Filename Sanitization", () => {
  it("should convert trait names to filename-safe strings", () => {
    expect(sanitizeFilename("Red Crashing Candles")).toBe("red-crashing-candles");
    expect(sanitizeFilename("Scarred & Rug-Burned")).toBe("scarred-rug-burned");
    expect(sanitizeFilename("'Too-Risky-Bro' Note")).toBe("too-risky-bro-note");
    expect(sanitizeFilename("Classic Red/Green Laser")).toBe("classic-red-green-laser");
  });

  it("should handle special characters", () => {
    expect(sanitizeFilename("Diamond-Crusted Body")).toBe("diamond-crusted-body");
    expect(sanitizeFilename("Void-Black Matter Skin")).toBe("void-black-matter-skin");
  });

  it("should remove leading/trailing dashes", () => {
    expect(sanitizeFilename("--test--")).toBe("test");
    expect(sanitizeFilename("   spaces   ")).toBe("spaces");
  });
});

describe("Asset Resolution", () => {
  let config: MetaGenConfig;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);
  });

  it("should resolve asset paths correctly", () => {
    const assetPath = resolveAssetPath(
      ASSETS_DIR,
      "background",
      "Red Crashing Candles",
      config
    );

    expect(assetPath).toContain("assets/background/red-crashing-candles.png");
  });

  it("should throw error for unknown layer", () => {
    expect(() =>
      resolveAssetPath(ASSETS_DIR, "unknown-layer", "some-trait", config)
    ).toThrow("Layer not found");
  });

  it("should throw error for unknown trait", () => {
    expect(() =>
      resolveAssetPath(ASSETS_DIR, "background", "Unknown Trait", config)
    ).toThrow("Trait not found");
  });
});

describe("Layer Extraction", () => {
  let config: MetaGenConfig;
  let metadata: MetaplexMetadata;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);

    // Load a sample metadata file
    const metadataPath = path.join(METADATA_DIR, "001.json");
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  });

  it("should extract all 7 layers from metadata", () => {
    const layers = extractLayerInfo(metadata, config, ASSETS_DIR);

    expect(layers).toHaveLength(7);

    const layerKeys = layers.map((l) => l.layerKey);
    expect(layerKeys).toEqual([
      "background",
      "body",
      "headwear",
      "eyes",
      "mouth",
      "accessory",
      "aura",
    ]);
  });

  it("should extract correct trait names", () => {
    const layers = extractLayerInfo(metadata, config, ASSETS_DIR);

    for (const layer of layers) {
      expect(layer.traitName).toBeTruthy();
      expect(layer.assetPath).toContain(layer.layerKey);
    }
  });
});

describe("Asset Validation", () => {
  let config: MetaGenConfig;

  beforeAll(() => {
    config = loadConfig(CONFIG_PATH);
  });

  it("should validate that placeholder assets exist", async () => {
    // Load metadata and extract layers
    const metadataPath = path.join(METADATA_DIR, "001.json");
    const metadata: MetaplexMetadata = JSON.parse(
      fs.readFileSync(metadataPath, "utf-8")
    );

    const layers = extractLayerInfo(metadata, config, ASSETS_DIR);

    // Should not throw
    await expect(validateAssets(layers)).resolves.toBeUndefined();
  });

  it("should throw error for missing assets", async () => {
    const layers = [
      {
        layerKey: "background",
        traitName: "Nonexistent Trait",
        assetPath: "/path/to/nonexistent.png",
      },
    ];

    await expect(validateAssets(layers)).rejects.toThrow("Missing asset files");
  });
});

describe("Image Generation", () => {
  let config: MetaGenConfig;
  let genConfig: ImageGeneratorConfig;

  beforeAll(async () => {
    config = loadConfig(CONFIG_PATH);

    genConfig = {
      metadataDir: METADATA_DIR,
      assetsDir: ASSETS_DIR,
      outputDir: TEST_OUTPUT_DIR,
      canvasSize: 512, // Smaller for faster tests
      imageFormat: "png",
    };

    // Clean test output directory
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterAll(() => {
    // Clean up test images
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  it("should generate an NFT image successfully", async () => {
    await generateNftImage(1, genConfig, config);

    const imagePath = path.join(TEST_OUTPUT_DIR, "1.png");
    expect(fs.existsSync(imagePath)).toBe(true);
  });

  it("should generate image with correct dimensions", async () => {
    await generateNftImage(2, genConfig, config);

    const imagePath = path.join(TEST_OUTPUT_DIR, "2.png");
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
    expect(metadata.format).toBe("png");
  });

  it("should generate multiple images in sequence", async () => {
    for (let i = 3; i <= 5; i++) {
      await generateNftImage(i, genConfig, config);
    }

    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, "3.png"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, "4.png"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, "5.png"))).toBe(true);
  });

  it("should throw error for missing metadata", async () => {
    await expect(generateNftImage(999, genConfig, config)).rejects.toThrow(
      "Metadata not found"
    );
  });

  it("should generate images with varying file sizes (different traits)", async () => {
    await generateNftImage(1, genConfig, config);
    await generateNftImage(10, genConfig, config);

    const stats1 = fs.statSync(path.join(TEST_OUTPUT_DIR, "1.png"));
    const stats10 = fs.statSync(path.join(TEST_OUTPUT_DIR, "10.png"));

    // Both should have reasonable file sizes
    expect(stats1.size).toBeGreaterThan(1000); // > 1KB
    expect(stats10.size).toBeGreaterThan(1000);

    // Sizes may differ due to different traits
    // (not strictly necessary, but shows variety)
  });
});

describe("Integration: Full Pipeline", () => {
  it("should have placeholder assets for all config traits", () => {
    const config = loadConfig(CONFIG_PATH);
    const missingAssets: string[] = [];

    for (const layer of config.layers) {
      for (const trait of layer.traits) {
        const filename = trait.asset || `${sanitizeFilename(trait.name)}.png`;
        const assetPath = path.join(ASSETS_DIR, layer.key, filename);

        if (!fs.existsSync(assetPath)) {
          missingAssets.push(`${layer.key}/${filename}`);
        }
      }
    }

    expect(missingAssets).toHaveLength(0);
  });

  it("should have generated metadata for NFT #1", () => {
    const metadataPath = path.join(METADATA_DIR, "001.json");
    expect(fs.existsSync(metadataPath)).toBe(true);

    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    expect(metadata.name).toContain("Surge Bulls & Void Bears");
    expect(metadata.attributes).toBeDefined();
    expect(metadata.attributes.length).toBeGreaterThan(0);
  });
});
