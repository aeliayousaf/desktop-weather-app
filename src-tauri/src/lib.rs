use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

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
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "settings" => {
                        if let Some(window) = app.get_webview_window("settings") {
                            let _ = window.show();
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
                let _ = overlay.set_ignore_cursor_events(true);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
