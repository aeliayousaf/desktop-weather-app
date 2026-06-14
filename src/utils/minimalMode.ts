import { invoke } from "@tauri-apps/api/core";

export async function applyMinimalMode(
  enabled: boolean,
  options: { hideSettings?: boolean } = {},
) {
  await invoke("set_minimal_mode", {
    enabled,
    hideSettings: options.hideSettings ?? enabled,
  });
}

export async function openFullSettings() {
  await invoke("open_settings_window");
}

export async function showSettingsOnStartup() {
  await invoke("show_settings_on_startup");
}
