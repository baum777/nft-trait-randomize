/**
 * Quick test script for image generation
 */

import { generateAllImages } from "./image-generator.js";
import { loadConfig } from "./generator.js";
import * as path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const metaConfig = loadConfig(path.join(__dirname, "metaagen-config.json"));

const genConfig = {
  metadataDir: path.join(__dirname, "out", "metadata"),
  assetsDir: path.join(__dirname, "assets"),
  outputDir: path.join(__dirname, "out", "images"),
  canvasSize: 1024,
  imageFormat: "png" as const,
};

// Generate first 5 NFTs for testing
await generateAllImages(genConfig, metaConfig, {
  startId: 1,
  endId: 5,
  logInterval: 1,
});

console.log("\n✅ Test image generation complete!");
