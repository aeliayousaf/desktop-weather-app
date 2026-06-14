import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const sourceCandidates = [
  path.join(root, "ChatGPT Image Jun 14, 2026, 10_13_43 AM.png"),
  path.join(root, "app-icon.png"),
];
const source = sourceCandidates.find((candidate) => fs.existsSync(candidate));

if (!source) {
  throw new Error("No app icon source image found.");
}

const output = path.join(root, "app-icon.png");
const size = 1024;
const margin = Math.round(size * 0.02);
const traySizes = [32, 64];

const trimmed = await sharp(source).trim().toBuffer();
const trimmedMeta = await sharp(trimmed).metadata();

await sharp(trimmed)
  .resize(size - margin * 2, size - margin * 2, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .extend({
    top: margin,
    bottom: margin,
    left: margin,
    right: margin,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(output);

console.log(
  `Prepared ${path.basename(output)} from ${path.basename(source)} (${trimmedMeta.width}x${trimmedMeta.height} trimmed content -> ${size}x${size})`,
);

const iconsDir = path.join(root, "src-tauri", "icons");
for (const traySize of traySizes) {
  const trayMargin = Math.max(1, Math.round(traySize * 0.02));
  const trayPath = path.join(iconsDir, `tray-${traySize}.png`);
  await sharp(trimmed)
    .resize(traySize - trayMargin * 2, traySize - trayMargin * 2, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: trayMargin,
      bottom: trayMargin,
      left: trayMargin,
      right: trayMargin,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(trayPath);
  console.log(`Prepared ${path.basename(trayPath)}`);
}
