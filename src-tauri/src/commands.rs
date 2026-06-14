use tauri::{AppHandle, Manager, PhysicalPosition};
use tauri::window::Color;

const WIDGET_WIDTH: i32 = 400;
const WIDGET_MARGIN: i32 = 24;

fn apply_settings_window_effects(window: &tauri::WebviewWindow) {
    use tauri::window::{Effect, EffectsBuilder};

    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
    let _ = window.set_effects(
        EffectsBuilder::new()
            .effect(Effect::Acrylic)
            .color(Color(255, 255, 255, 40))
            .build(),
    );
}

fn prepare_widget_window(window: &tauri::WebviewWindow) {
    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
    let _ = window.set_effects(None::<tauri::utils::config::WindowEffectsConfig>);
}

fn position_widget(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let work = monitor.work_area();
        let x = work.position.x + work.size.width as i32 - WIDGET_WIDTH - WIDGET_MARGIN;
        let y = work.position.y + WIDGET_MARGIN;
        let _ = window.set_position(PhysicalPosition::new(x, y));
    }
}

#[tauri::command]
pub fn set_minimal_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    let widget = app
        .get_webview_window("widget")
        .ok_or("widget window not found")?;
    let settings = app
        .get_webview_window("settings")
        .ok_or("settings window not found")?;

    if enabled {
        position_widget(&widget);
        prepare_widget_window(&widget);
        widget
            .set_always_on_top(true)
            .map_err(|error| error.to_string())?;
        widget.show().map_err(|error| error.to_string())?;
        widget.set_focus().map_err(|error| error.to_string())?;
        settings.hide().map_err(|error| error.to_string())?;
    } else {
        widget.hide().map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_settings_window(app: AppHandle) -> Result<(), String> {
    let settings = app
        .get_webview_window("settings")
        .ok_or("settings window not found")?;

    apply_settings_window_effects(&settings);
    settings
        .unminimize()
        .map_err(|error| error.to_string())?;
    settings.show().map_err(|error| error.to_string())?;
    settings
        .set_always_on_top(true)
        .map_err(|error| error.to_string())?;
    settings.set_focus().map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn show_settings_on_startup(app: AppHandle) -> Result<(), String> {
    let settings = app
        .get_webview_window("settings")
        .ok_or("settings window not found")?;

    apply_settings_window_effects(&settings);
    settings.show().map_err(|error| error.to_string())?;
    settings
        .set_always_on_top(true)
        .map_err(|error| error.to_string())?;
    settings.set_focus().map_err(|error| error.to_string())?;

    Ok(())
}
