import { invoke } from "@tauri-apps/api/core";

export async function ensureOverlayOnTop() {
  await invoke("ensure_overlay_on_top");
}
