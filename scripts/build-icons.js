#!/usr/bin/env node
/**
 * Build raster PNG icons from SVG source using sharp.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SIZES = [16, 32, 48, 128, 256, 512];
const SRC = path.join(__dirname, "..", "icons", "icon-source.svg");
const DARK_SRC = path.join(__dirname, "..", "icons", "icon-source-dark.svg");
const OUT_DIR = path.join(__dirname, "..", "icons");

async function run() {
  if (!fs.existsSync(SRC)) {
    console.error("Source SVG not found:", SRC);
    process.exit(1);
  }
  async function buildVariant(label, source, suffix = "") {
    for (const size of SIZES) {
      const name = suffix ? `icon${size}${suffix}.png` : `icon${size}.png`;
      const out = path.join(OUT_DIR, name);
      try {
        await sharp(source)
          .resize(size, size, { fit: "cover" })
          .png({ compressionLevel: 9 })
          .toFile(out);
        console.log(`[${label}] Generated`, out);
      } catch (e) {
        console.error(`[${label}] Failed generating`, size, e);
        process.exitCode = 1;
      }
    }
  }

  await buildVariant("light", SRC);
  if (fs.existsSync(DARK_SRC)) {
    await buildVariant("dark", DARK_SRC, "-dark");
  }
  console.log("All icons generated.");
}
run();
