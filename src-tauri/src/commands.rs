use tauri::{AppHandle, Manager, PhysicalPosition, WebviewWindow};
use tauri::window::Color;

const WIDGET_WIDTH: i32 = 400;
const WIDGET_MARGIN: i32 = 24;

/// Keeps the fullscreen overlay above normal apps. Re-stacks widget/settings above it when visible.
pub fn ensure_overlay_stack(app: &AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.set_ignore_cursor_events(true);
        let _ = overlay.set_always_on_top(true);
        let _ = overlay.show();
    }

    if let Some(widget) = app.get_webview_window("widget") {
        if widget.is_visible().unwrap_or(false) {
            let _ = widget.set_always_on_top(true);
        }
    }

    if let Some(settings) = app.get_webview_window("settings") {
        if settings.is_visible().unwrap_or(false) {
            let _ = settings.set_always_on_top(true);
        }
    }
}

#[tauri::command]
pub fn ensure_overlay_on_top(app: AppHandle) -> Result<(), String> {
    ensure_overlay_stack(&app);
    Ok(())
}

/// Acrylic blur while focused; CSS frost when unfocused (Windows disables acrylic when inactive).
pub fn set_settings_window_effects(window: &WebviewWindow, focused: bool) {
    use tauri::window::{Effect, EffectsBuilder};

    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
    if focused {
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effect(Effect::Acrylic)
                .color(Color(255, 255, 255, 40))
                .build(),
        );
    } else {
        let _ = window.set_effects(None::<tauri::utils::config::WindowEffectsConfig>);
    }
}

pub fn set_widget_window_effects(window: &WebviewWindow, focused: bool) {
    use tauri::window::{Effect, EffectsBuilder};

    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
    if focused {
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effect(Effect::Acrylic)
                .color(Color(255, 255, 255, 72))
                .build(),
        );
    } else {
        let _ = window.set_effects(None::<tauri::utils::config::WindowEffectsConfig>);
    }
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
pub fn set_minimal_mode(
    app: AppHandle,
    enabled: bool,
    hide_settings: bool,
) -> Result<(), String> {
    let widget = app
        .get_webview_window("widget")
        .ok_or("widget window not found")?;
    let settings = app
        .get_webview_window("settings")
        .ok_or("settings window not found")?;

    if enabled {
        position_widget(&widget);
        widget
            .set_always_on_top(true)
            .map_err(|error| error.to_string())?;
        widget.show().map_err(|error| error.to_string())?;

        if hide_settings {
            settings.hide().map_err(|error| error.to_string())?;
            widget.set_focus().map_err(|error| error.to_string())?;
            set_widget_window_effects(&widget, true);
        } else {
            set_widget_window_effects(&widget, widget.is_focused().unwrap_or(false));
        }

        ensure_overlay_stack(&app);
    } else {
        widget.hide().map_err(|error| error.to_string())?;
        ensure_overlay_stack(&app);
    }

    Ok(())
}

#[tauri::command]
pub fn open_settings_window(app: AppHandle) -> Result<(), String> {
    let settings = app
        .get_webview_window("settings")
        .ok_or("settings window not found")?;

    settings
        .unminimize()
        .map_err(|error| error.to_string())?;
    settings.show().map_err(|error| error.to_string())?;
    settings
        .set_always_on_top(true)
        .map_err(|error| error.to_string())?;
    settings.set_focus().map_err(|error| error.to_string())?;
    set_settings_window_effects(&settings, true);
    ensure_overlay_stack(&app);

    Ok(())
}

#[tauri::command]
pub fn show_settings_on_startup(app: AppHandle) -> Result<(), String> {
    let settings = app
        .get_webview_window("settings")
        .ok_or("settings window not found")?;

    settings.show().map_err(|error| error.to_string())?;
    settings
        .set_always_on_top(true)
        .map_err(|error| error.to_string())?;
    settings.set_focus().map_err(|error| error.to_string())?;
    set_settings_window_effects(&settings, true);
    ensure_overlay_stack(&app);

    Ok(())
}
