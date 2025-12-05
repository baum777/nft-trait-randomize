/**
 * Surge Bulls & Void Bears - Image Generator
 *
 * Generates NFT images by compositing layer assets based on metadata.
 * Uses Sharp for high-performance image processing.
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import type { MetaGenConfig, MetaplexMetadata } from "./types";

// ============================================================================
// Configuration
// ============================================================================

export interface ImageGeneratorConfig {
  metadataDir: string;      // Directory containing JSON metadata
  assetsDir: string;        // Directory containing layer assets
  outputDir: string;        // Directory for output images
  canvasSize: number;       // Image size (e.g., 1024 for 1024x1024)
  imageFormat: "png" | "jpg";
  quality?: number;         // For JPG only (1-100)
}

export interface LayerInfo {
  layerKey: string;
  traitName: string;
  assetPath: string;
}

// Layer rendering order (bottom to top)
const LAYER_ORDER = [
  "background",
  "body",
  "headwear",
  "eyes",
  "mouth",
  "accessory",
  "aura",
];

// ============================================================================
// Asset Resolution
// ============================================================================

/**
 * Converts a trait name to a filename-safe string
 * e.g., "Red Crashing Candles" -> "red-crashing-candles"
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves the asset file path for a given trait
 */
export function resolveAssetPath(
  assetsDir: string,
  layerKey: string,
  traitName: string,
  config: MetaGenConfig
): string {
  // Find the layer and trait in config
  const layer = config.layers.find((l) => l.key === layerKey);
  if (!layer) {
    throw new Error(`Layer not found: ${layerKey}`);
  }

  const trait = layer.traits.find((t) => t.name === traitName);
  if (!trait) {
    throw new Error(`Trait not found: ${traitName} in layer ${layerKey}`);
  }

  // Use explicit asset filename if provided, otherwise generate from trait name
  const filename = trait.asset || `${sanitizeFilename(traitName)}.png`;
  const assetPath = path.join(assetsDir, layerKey, filename);

  return assetPath;
}

/**
 * Extracts layer information from metadata
 */
export function extractLayerInfo(
  metadata: MetaplexMetadata,
  config: MetaGenConfig,
  assetsDir: string
): LayerInfo[] {
  const layers: LayerInfo[] = [];

  // Extract layer traits from attributes
  for (const layerKey of LAYER_ORDER) {
    const attr = metadata.attributes.find(
      (a) => a.trait_type.toLowerCase() === layerKey.toLowerCase()
    );

    if (!attr) {
      console.warn(`Warning: Layer ${layerKey} not found in metadata`);
      continue;
    }

    const traitName = String(attr.value);
    const assetPath = resolveAssetPath(assetsDir, layerKey, traitName, config);

    layers.push({
      layerKey,
      traitName,
      assetPath,
    });
  }

  return layers;
}

// ============================================================================
// Image Compositing
// ============================================================================

/**
 * Validates that all asset files exist
 */
export async function validateAssets(layers: LayerInfo[]): Promise<void> {
  const missing: string[] = [];

  for (const layer of layers) {
    if (!fs.existsSync(layer.assetPath)) {
      missing.push(`${layer.layerKey}: ${layer.assetPath}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing asset files:\n${missing.map((m) => `  - ${m}`).join("\n")}`
    );
  }
}

/**
 * Composites multiple layers into a single image
 */
export async function compositeLayers(
  layers: LayerInfo[],
  canvasSize: number
): Promise<sharp.Sharp> {
  // Create base canvas
  let canvas = sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  // Composite layers in order
  const compositeInputs: sharp.OverlayOptions[] = [];

  for (const layer of layers) {
    // Read and resize layer to canvas size
    const layerBuffer = await sharp(layer.assetPath)
      .resize(canvasSize, canvasSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    compositeInputs.push({
      input: layerBuffer,
      blend: "over",
    });
  }

  // Apply all composites at once (more efficient)
  if (compositeInputs.length > 0) {
    canvas = canvas.composite(compositeInputs);
  }

  return canvas;
}

// ============================================================================
// NFT Image Generation
// ============================================================================

/**
 * Generates a single NFT image from metadata
 */
export async function generateNftImage(
  nftId: number,
  genConfig: ImageGeneratorConfig,
  metaConfig: MetaGenConfig
): Promise<void> {
  // Load metadata
  const idStr = String(nftId).padStart(3, "0");
  const metadataPath = path.join(genConfig.metadataDir, `${idStr}.json`);

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata not found: ${metadataPath}`);
  }

  const metadata: MetaplexMetadata = JSON.parse(
    fs.readFileSync(metadataPath, "utf-8")
  );

  // Extract layer info
  const layers = extractLayerInfo(metadata, metaConfig, genConfig.assetsDir);

  // Validate assets exist
  await validateAssets(layers);

  // Composite layers
  const image = await compositeLayers(layers, genConfig.canvasSize);

  // Export image
  const outputPath = path.join(
    genConfig.outputDir,
    `${nftId}.${genConfig.imageFormat}`
  );

  if (genConfig.imageFormat === "jpg") {
    await image.jpeg({ quality: genConfig.quality || 90 }).toFile(outputPath);
  } else {
    await image.png({ compressionLevel: 9 }).toFile(outputPath);
  }
}

/**
 * Generates all NFT images in batch
 */
export async function generateAllImages(
  genConfig: ImageGeneratorConfig,
  metaConfig: MetaGenConfig,
  options: {
    startId?: number;
    endId?: number;
    logInterval?: number;
  } = {}
): Promise<void> {
  const startId = options.startId || 1;
  const endId = options.endId || 333;
  const logInterval = options.logInterval || 50;

  console.log(`Generating images ${startId} to ${endId}...`);
  console.log(`Canvas size: ${genConfig.canvasSize}x${genConfig.canvasSize}`);
  console.log(`Format: ${genConfig.imageFormat.toUpperCase()}`);

  // Create output directory
  await fs.promises.mkdir(genConfig.outputDir, { recursive: true });

  // Generate images
  for (let id = startId; id <= endId; id++) {
    try {
      await generateNftImage(id, genConfig, metaConfig);

      if (id % logInterval === 0 || id === endId) {
        console.log(`  Generated ${id}/${endId}...`);
      }
    } catch (err) {
      console.error(`\nError generating NFT #${id}:`, err);
      throw err;
    }
  }

  console.log(`\n✓ Successfully generated ${endId - startId + 1} images`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

export async function main() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  // Load metadata config
  const configPath = path.join(__dirname, "metaagen-config.json");
  const metaConfig: MetaGenConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  );

  // Generator config
  const genConfig: ImageGeneratorConfig = {
    metadataDir: path.join(__dirname, "out", "metadata"),
    assetsDir: path.join(__dirname, "assets"),
    outputDir: path.join(__dirname, "out", "images"),
    canvasSize: 1024,
    imageFormat: "png",
  };

  await generateAllImages(genConfig, metaConfig);
}

// Check if this file is being run directly (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main()
    .then(() => {
      console.log("\n🎉 Image generation complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Image generation failed:");
      console.error(err);
      process.exit(1);
    });
}
