/**
 * Tests for Image Generator
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { loadConfig } from "../generator";
import { generateImage } from "../image-generator";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const configPath = path.join(__dirname, "..", "metaagen-config.json");

describe("Image Generator", () => {
  describe("Config Canvas Settings", () => {
    it("should have canvas configuration", () => {
      const config = loadConfig(configPath);
      expect(config.canvas).toBeDefined();
      expect(config.canvas.width).toBe(1024);
      expect(config.canvas.height).toBe(1024);
    });
  });

  describe("Asset Configuration", () => {
    it("should have asset field for all traits", () => {
      const config = loadConfig(configPath);

      for (const layer of config.layers) {
        for (const trait of layer.traits) {
          expect(trait.asset).toBeDefined();
          expect(trait.asset).toMatch(/\.png$/);
        }
      }
    });

    it("should have unique asset filenames per layer", () => {
      const config = loadConfig(configPath);

      for (const layer of config.layers) {
        const assetNames = layer.traits.map((t) => t.asset);
        const uniqueNames = new Set(assetNames);
        expect(uniqueNames.size).toBe(assetNames.length);
      }
    });
  });

  describe("Layer Order", () => {
    it("should have layers in correct order", () => {
      const config = loadConfig(configPath);
      const expectedOrder = [
        "background",
        "body",
        "eyes",
        "headwear",
        "mouth",
        "accessory",
        "aura",
      ];

      const layerKeys = config.layers.map((l) => l.key);
      expect(layerKeys).toEqual(expectedOrder);
    });
  });

  describe("Mock Asset Generation", () => {
    let testAssetsDir: string;
    let testMetadataDir: string;
    let testOutputDir: string;

    beforeAll(async () => {
      // Create temporary test directories
      const testDir = path.join(__dirname, "..", "test-assets-tmp");
      testAssetsDir = path.join(testDir, "assets");
      testMetadataDir = path.join(testDir, "metadata");
      testOutputDir = path.join(testDir, "images");

      await fs.promises.mkdir(testAssetsDir, { recursive: true });
      await fs.promises.mkdir(testMetadataDir, { recursive: true });
      await fs.promises.mkdir(testOutputDir, { recursive: true });

      // Create mock assets - simple colored squares for each layer
      const config = loadConfig(configPath);
      const layerColors = {
        background: { r: 255, g: 0, b: 0 },
        body: { r: 0, g: 255, b: 0 },
        eyes: { r: 0, g: 0, b: 255 },
        headwear: { r: 255, g: 255, b: 0 },
        mouth: { r: 255, g: 0, b: 255 },
        accessory: { r: 0, g: 255, b: 255 },
        aura: { r: 128, g: 128, b: 128 },
      };

      for (const layer of config.layers) {
        const layerDir = path.join(testAssetsDir, layer.key);
        await fs.promises.mkdir(layerDir, { recursive: true });

        const color = layerColors[layer.key as keyof typeof layerColors];

        for (const trait of layer.traits) {
          // Create a simple colored PNG with transparency
          const assetPath = path.join(layerDir, trait.asset);
          await sharp({
            create: {
              width: 1024,
              height: 1024,
              channels: 4,
              background: { r: color.r, g: color.g, b: color.b, alpha: 0.5 },
            },
          })
            .png()
            .toFile(assetPath);
        }
      }

      // Create a sample metadata file
      const sampleMetadata = {
        name: "Test NFT #001",
        symbol: "SURGE",
        description: "Test NFT",
        seller_fee_basis_points: 500,
        image: "ipfs://QmTest/1.png",
        external_url: "https://test.xyz",
        collection: {
          name: "Test Collection",
          family: "Test",
        },
        attributes: [
          { trait_type: "Station", display_type: "number", value: 1 },
          { trait_type: "Station Name", value: "The Ordinary World" },
          { trait_type: "Archetype", value: "Bull" },
          { trait_type: "Tier", value: "Paperhand Newbie" },
          { trait_type: "Tier Score", display_type: "number", value: 14 },
          { trait_type: "Background", value: "Red Crashing Candles" },
          { trait_type: "Body", value: "Skinny Shaking Newbie" },
          { trait_type: "Eyes", value: "Empty Dead-Fish Eyes" },
          { trait_type: "Headwear", value: "Broken Paperbag Mask" },
          { trait_type: "Mouth", value: "Nervous Bite" },
          { trait_type: "Accessory", value: "Empty Wallet Chain" },
          { trait_type: "Aura", value: "Red Blood Drip" },
        ],
        properties: {
          category: "image",
          files: [{ uri: "1.png", type: "image/png" }],
          creators: [{ address: "TestAddress", share: 100 }],
        },
      };

      const metadataPath = path.join(testMetadataDir, "001.json");
      await fs.promises.writeFile(
        metadataPath,
        JSON.stringify(sampleMetadata, null, 2),
        "utf-8"
      );
    });

    afterAll(async () => {
      // Clean up test directories
      const testDir = path.join(__dirname, "..", "test-assets-tmp");
      await fs.promises.rm(testDir, { recursive: true, force: true });
    });

    it("should generate an image from metadata", async () => {
      const config = loadConfig(configPath);
      const metadataPath = path.join(testMetadataDir, "001.json");
      const outputPath = path.join(testOutputDir, "001.png");

      await generateImage(metadataPath, outputPath, config, testAssetsDir);

      // Verify the image was created
      const fileExists = await fs.promises
        .access(outputPath, fs.constants.R_OK)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);
    });

    it("should generate image with correct dimensions", async () => {
      const outputPath = path.join(testOutputDir, "001.png");

      // Check image dimensions
      const metadata = await sharp(outputPath).metadata();
      expect(metadata.width).toBe(1024);
      expect(metadata.height).toBe(1024);
      expect(metadata.format).toBe("png");
    });

    it("should generate image with transparency support", async () => {
      const outputPath = path.join(testOutputDir, "001.png");

      // Check that image has alpha channel
      const metadata = await sharp(outputPath).metadata();
      expect(metadata.channels).toBe(4); // RGBA
    });
  });
});
