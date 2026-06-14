import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");

fs.copyFileSync(
  path.join(root, "src-tauri", "icons", "icon.png"),
  path.join(publicDir, "icon.png"),
);
fs.copyFileSync(
  path.join(root, "src-tauri", "icons", "icon.ico"),
  path.join(publicDir, "favicon.ico"),
);
fs.copyFileSync(
  path.join(root, "app-icon.png"),
  path.join(publicDir, "app-logo.png"),
);

console.log("Synced public icon assets");
