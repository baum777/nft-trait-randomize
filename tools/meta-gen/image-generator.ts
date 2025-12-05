/**
 * Surge Bulls & Void Bears NFT Image Generator
 *
 * Generates final NFT images by compositing layer-based PNG assets
 * based on the metadata JSON files produced by generator.ts
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import type {
  MetaGenConfig,
  MetaplexMetadata,
  LayerConfig,
  TraitConfig,
} from "./types";
import { loadConfig } from "./generator";

// ============================================================================
// Layer Order - From back to front
// ============================================================================

const LAYER_ORDER = [
  "background",
  "body",
  "headwear",
  "eyes",
  "mouth",
  "accessory",
  "aura",
] as const;

// ============================================================================
// Asset Resolution
// ============================================================================

/**
 * Resolves the asset filename for a given trait value
 */
function resolveAssetForTrait(
  config: MetaGenConfig,
  layerKey: string,
  traitValue: string
): string | null {
  const layer = config.layers.find((l) => l.key === layerKey);
  if (!layer) {
    console.warn(`Layer not found: ${layerKey}`);
    return null;
  }

  const trait = layer.traits.find((t) => t.name === traitValue);
  if (!trait) {
    console.warn(`Trait not found: ${traitValue} in layer ${layerKey}`);
    return null;
  }

  return trait.asset;
}

/**
 * Builds the full path to an asset file
 */
function getAssetPath(
  assetsDir: string,
  layerKey: string,
  assetFilename: string
): string {
  return path.join(assetsDir, layerKey, assetFilename);
}

// ============================================================================
// Layer Composition
// ============================================================================

interface LayerAsset {
  layerKey: string;
  assetPath: string;
}

/**
 * Extracts layer assets from metadata in the correct rendering order
 */
function extractLayerAssets(
  metadata: MetaplexMetadata,
  config: MetaGenConfig,
  assetsDir: string
): LayerAsset[] {
  const assets: LayerAsset[] = [];

  for (const layerKey of LAYER_ORDER) {
    // Find the trait for this layer in metadata.attributes
    const attr = metadata.attributes.find(
      (a) => a.trait_type && a.trait_type.toLowerCase() === layerKey.toLowerCase()
    );

    if (!attr) {
      console.warn(`No attribute found for layer: ${layerKey}`);
      continue;
    }

    const traitValue = String(attr.value);
    const assetFilename = resolveAssetForTrait(config, layerKey, traitValue);

    if (!assetFilename) {
      console.warn(`No asset filename for ${layerKey}: ${traitValue}`);
      continue;
    }

    const assetPath = getAssetPath(assetsDir, layerKey, assetFilename);
    assets.push({ layerKey, assetPath });
  }

  return assets;
}

/**
 * Checks if all required asset files exist
 */
async function validateAssets(assets: LayerAsset[]): Promise<{
  valid: boolean;
  missing: string[];
}> {
  const missing: string[] = [];

  for (const asset of assets) {
    try {
      await fs.promises.access(asset.assetPath, fs.constants.R_OK);
    } catch {
      missing.push(asset.assetPath);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Composites multiple PNG layers into a single image using Sharp
 */
async function compositeLayers(
  assets: LayerAsset[],
  canvasWidth: number,
  canvasHeight: number
): Promise<Buffer> {
  if (assets.length === 0) {
    throw new Error("No assets to composite");
  }

  // Start with the first layer (background)
  let composite = sharp(assets[0].assetPath).resize(canvasWidth, canvasHeight, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  // Composite remaining layers on top
  const overlays = await Promise.all(
    assets.slice(1).map(async (asset) => {
      const buffer = await sharp(asset.assetPath)
        .resize(canvasWidth, canvasHeight, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      return { input: buffer };
    })
  );

  if (overlays.length > 0) {
    composite = composite.composite(overlays);
  }

  return composite.png().toBuffer();
}

// ============================================================================
// Image Generation
// ============================================================================

/**
 * Generates a single NFT image from metadata
 */
export async function generateImage(
  metadataPath: string,
  outputPath: string,
  config: MetaGenConfig,
  assetsDir: string
): Promise<void> {
  // Load metadata
  const metadataContent = await fs.promises.readFile(metadataPath, "utf-8");
  const metadata: MetaplexMetadata = JSON.parse(metadataContent);

  // Extract layer assets in correct order
  const assets = extractLayerAssets(metadata, config, assetsDir);

  if (assets.length === 0) {
    throw new Error(`No assets found for metadata: ${metadataPath}`);
  }

  // Validate that all assets exist
  const validation = await validateAssets(assets);
  if (!validation.valid) {
    throw new Error(
      `Missing asset files:\n${validation.missing.join("\n")}`
    );
  }

  // Composite layers
  const imageBuffer = await compositeLayers(
    assets,
    config.canvas.width,
    config.canvas.height
  );

  // Write output
  await fs.promises.writeFile(outputPath, imageBuffer);
}

/**
 * Generates all NFT images from metadata directory
 */
export async function generateAllImages(
  configPath: string,
  metadataDir: string,
  outputDir: string,
  assetsDir: string
): Promise<void> {
  console.log("Loading config from:", configPath);
  const config = loadConfig(configPath);

  console.log(`Canvas size: ${config.canvas.width}x${config.canvas.height}`);

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Find all metadata JSON files
  const files = await fs.promises.readdir(metadataDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

  if (jsonFiles.length === 0) {
    throw new Error(`No metadata JSON files found in: ${metadataDir}`);
  }

  console.log(`Found ${jsonFiles.length} metadata files`);
  console.log("Generating images...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const jsonFile of jsonFiles) {
    const metadataPath = path.join(metadataDir, jsonFile);
    const imageFilename = jsonFile.replace(".json", ".png");
    const outputPath = path.join(outputDir, imageFilename);

    try {
      await generateImage(metadataPath, outputPath, config, assetsDir);
      successCount++;

      // Log progress every 50 images
      if (successCount % 50 === 0 || successCount === jsonFiles.length) {
        console.log(`  Generated ${successCount}/${jsonFiles.length}...`);
      }
    } catch (err) {
      errorCount++;
      console.error(`Failed to generate ${imageFilename}:`, err);
    }
  }

  console.log(
    `\n✓ Image generation complete: ${successCount} successful, ${errorCount} errors`
  );
  console.log(`Output directory: ${outputDir}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const configPath = path.join(__dirname, "metaagen-config.json");
  const metadataDir = path.join(__dirname, "out", "metadata");
  const outputDir = path.join(__dirname, "out", "images");
  const assetsDir = path.join(__dirname, "..", "..", "assets");

  generateAllImages(configPath, metadataDir, outputDir, assetsDir)
    .then(() => {
      console.log("\n🎉 All images generated!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Image generation failed:");
      console.error(err);
      process.exit(1);
    });
}
