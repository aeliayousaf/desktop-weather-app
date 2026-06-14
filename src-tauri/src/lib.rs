mod commands;

use commands::{open_settings_window, set_minimal_mode, show_settings_on_startup};
use tauri::{
    image::Image,
    include_image,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    window::{Color, Effect, EffectsBuilder},
    Emitter, Manager, PhysicalPosition,
};

const TRAY_ICON: Image<'static> = include_image!("icons/tray-32.png");
const WINDOW_ICON: Image<'static> = include_image!("icons/128x128.png");
const WIDGET_WIDTH: i32 = 400;
const WIDGET_MARGIN: i32 = 24;

fn prepare_widget_window(window: &tauri::WebviewWindow) {
    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
    let _ = window.set_effects(None::<tauri::utils::config::WindowEffectsConfig>);
}

fn apply_settings_effects(window: &tauri::WebviewWindow) {
    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
    let _ = window.set_effects(
        EffectsBuilder::new()
            .effect(Effect::Acrylic)
            .color(Color(255, 255, 255, 40))
            .build(),
    );
}

fn position_widget(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let work = monitor.work_area();
        let x = work.position.x + work.size.width as i32 - WIDGET_WIDTH - WIDGET_MARGIN;
        let y = work.position.y + WIDGET_MARGIN;
        let _ = window.set_position(PhysicalPosition::new(x, y));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            set_minimal_mode,
            open_settings_window,
            show_settings_on_startup,
        ])
        .setup(|app| {
            let settings_item =
                MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let pause_item = CheckMenuItem::with_id(
                app,
                "pause",
                "Pause Animations",
                true,
                false,
                None::<&str>,
            )?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&settings_item, &pause_item, &quit_item])?;

            let pause_item_clone = pause_item.clone();
            let app_handle = app.handle().clone();

            let _tray = TrayIconBuilder::new()
                .icon(TRAY_ICON.clone())
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "settings" => {
                        let _ = open_settings_window(app.clone());
                    }
                    "pause" => {
                        let new_checked = !pause_item_clone.is_checked().unwrap_or(false);
                        let _ = pause_item_clone.set_checked(new_checked);
                        let _ = app_handle.emit("pause-toggled", new_checked);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            if let Some(overlay) = app.get_webview_window("overlay") {
                let _ = overlay.set_decorations(false);
                let _ = overlay.set_background_color(Some(Color(0, 0, 0, 0)));

                if let Ok(Some(monitor)) = overlay.current_monitor() {
                    let _ = overlay.set_position(*monitor.position());
                    let _ = overlay.set_size(*monitor.size());
                } else {
                    let _ = overlay.maximize();
                }

                let _ = overlay.set_always_on_top(true);
                let _ = overlay.set_ignore_cursor_events(true);
            }

            if let Some(settings) = app.get_webview_window("settings") {
                let _ = settings.set_icon(WINDOW_ICON.clone());
                apply_settings_effects(&settings);

                let app_handle = app.handle().clone();
                settings.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();

                        if let Some(settings) = app_handle.get_webview_window("settings") {
                            let _ = settings.hide();
                        }

                        if let Some(overlay) = app_handle.get_webview_window("overlay") {
                            let _ = overlay.set_always_on_top(true);
                            let _ = overlay.show();
                        }
                    }
                });
            }

            if let Some(widget) = app.get_webview_window("widget") {
                prepare_widget_window(&widget);
                position_widget(&widget);
                let _ = widget.set_always_on_top(true);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
