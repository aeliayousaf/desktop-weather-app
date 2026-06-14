use tauri::{
    image::Image,
    include_image,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    window::{Color, Effect, EffectsBuilder},
    Emitter, Manager,
};

const TRAY_ICON: Image<'static> = include_image!("icons/tray-32.png");
const WINDOW_ICON: Image<'static> = include_image!("icons/128x128.png");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
                        if let Some(window) = app.get_webview_window("settings") {
                            let _ = window.unminimize();
                            let _ = window.set_effects(
                                EffectsBuilder::new()
                                    .effect(Effect::Acrylic)
                                    .color(Color(255, 255, 255, 40))
                                    .build(),
                            );
                            let _ = window.show();
                            let _ = window.set_always_on_top(true);
                            let _ = window.set_focus();
                        }
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
                let _ = settings.set_background_color(Some(Color(0, 0, 0, 0)));
                let _ = settings.set_effects(
                    EffectsBuilder::new()
                        .effect(Effect::Acrylic)
                        .color(Color(255, 255, 255, 40))
                        .build(),
                );
                let _ = settings.show();
                let _ = settings.set_always_on_top(true);
                let _ = settings.set_focus();

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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
