/**
 * Creates placeholder assets for testing the image generator
 * Generates colored rectangles with trait names for each layer
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import type { MetaGenConfig } from "./types";
import { sanitizeFilename } from "./image-generator";

const COLORS = {
  CHAOS: { r: 200, g: 50, b: 50 },        // Red
  THRESHOLD: { r: 255, g: 165, b: 0 },   // Orange
  ORDEAL_REWARD: { r: 50, g: 200, b: 50 }, // Green
  MYTHIC: { r: 138, g: 43, b: 226 },     // Purple
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function createPlaceholderAsset(
  outputPath: string,
  traitName: string,
  category: "CHAOS" | "THRESHOLD" | "ORDEAL_REWARD" | "MYTHIC",
  size: number = 1024
): Promise<void> {
  const color = COLORS[category];
  const escapedName = escapeXml(traitName);

  // Create colored background with semi-transparency for layering
  const svg = `
    <svg width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="rgb(${color.r},${color.g},${color.b})" opacity="0.7"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="32"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >${escapedName}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

async function main() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const configPath = path.join(__dirname, "metaagen-config.json");
  const assetsDir = path.join(__dirname, "assets");

  // Load config
  const config: MetaGenConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  );

  console.log("Creating placeholder assets...");

  let count = 0;

  for (const layer of config.layers) {
    const layerDir = path.join(assetsDir, layer.key);
    await fs.promises.mkdir(layerDir, { recursive: true });

    for (const trait of layer.traits) {
      const filename = trait.asset || `${sanitizeFilename(trait.name)}.png`;
      const outputPath = path.join(layerDir, filename);

      await createPlaceholderAsset(
        outputPath,
        trait.name,
        trait.category,
        1024
      );

      count++;
      if (count % 10 === 0) {
        console.log(`  Created ${count} assets...`);
      }
    }
  }

  console.log(`\n✓ Created ${count} placeholder assets in ${assetsDir}`);
}

main().catch(console.error);
