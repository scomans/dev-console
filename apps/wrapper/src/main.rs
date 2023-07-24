#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]


use std::collections::{HashMap, HashSet};

use sysinfo::{Pid, PidExt, ProcessExt, Signal, System, SystemExt};
use tauri::{AppHandle, Manager, Window, Wry};
use tauri::api::process::{Command, CommandEvent, Encoding};
use tauri_plugin_log::LogTarget;
use tauri_plugin_window_state::{StateFlags, WindowExt};

// use window_vibrancy::apply_acrylic;

#[derive(Clone, serde::Serialize)]
struct ProcessOutput {
  channel_id: String,
  line: String,
}

#[derive(Clone, serde::Serialize)]
struct ProcessExit {
  channel_id: String,
  code: i32,
}

#[tauri::command]
fn open_devtools(window: Window<Wry>) {
  window.open_devtools();
}

#[tauri::command]
async fn init_window(app: AppHandle<Wry>, label: String) {
  let window = app.get_window(&label);
  if window.is_some() {
    let unwrapped_window = window.unwrap();
    unwrapped_window.restore_state(StateFlags::SIZE | StateFlags::POSITION | StateFlags::MAXIMIZED).unwrap();

    // #[cfg(target_os = "windows")]
    // apply_acrylic(&unwrapped_window, Some((61, 71, 106, 200)))
    //     .expect("Unsupported platform! 'apply_blur' is only supported on Windows");
  }
}

#[tauri::command]
async fn kill_process(pid: usize) -> Vec<u32> {
  let mut system = System::new();
  system.refresh_all();

  let p = Pid::from(pid);

  if let Some(process) = system.process(p) {
    let processes = system.processes();

    let mut parent_set = HashSet::from([pid as u32]);
    let mut child_set: HashSet<u32> = HashSet::new();
    let mut children = Vec::from([process]);

    let mut found_new = true;

    while found_new {
      found_new = false;
      for (_, process) in processes {
        if process.parent().is_some() {
          let parent = process.parent().unwrap();
          if parent_set.contains(&parent.as_u32()) && !child_set.contains(&process.pid().as_u32()) {
            parent_set.insert(process.pid().as_u32());
            child_set.insert(process.pid().as_u32());
            children.push(process);
            found_new = true;
          }
        }
      }
    }
    println!("parent_set: {:?}", parent_set);

    for child in children {
      child.kill_with(Signal::Kill).unwrap();
    }

    return child_set.into_iter().collect();
  }
  return Vec::new();
}

#[tauri::command]
fn spawn_process(
  app: AppHandle<Wry>,
  channel_id: String,
  programm: String,
  args: Vec<String>,
  cwd: String,
  env: HashMap<String, String>,
) -> i32 {
  let spawn = Command::new(programm)
    .args(args)
    .current_dir(cwd.into())
    .encoding(Encoding::for_label(b"utf-8").unwrap())
    .envs(env)
    .spawn();

  if spawn.is_err() {
    println!("spawn error: {:?}", spawn.err());
    app.emit_all("process-stderr", ProcessOutput { line: "program not found".into(), channel_id: channel_id.clone() }).unwrap();
    return -1;
  }

  let (mut rx, child) = spawn.unwrap();

  let pid = child.pid() as i32;

  // let arc_child = Arc::new(child);
  // commands().lock().unwrap().insert(pid, Mutex::new(arc_child.clone()));

  // state.0.insert(pid, child);

  tauri::async_runtime::spawn(async move {
    while let Some(event) = rx.recv().await {
      match event {
        CommandEvent::Terminated(terminated_payload) => {
          let exit_code = terminated_payload.code.unwrap();
          // println!("got TERMINATION: {}", exit_code);
          app.emit_all("process-exit", ProcessExit { code: exit_code, channel_id: channel_id.clone() }).unwrap();
        }
        CommandEvent::Stdout(line) => {
          // println!("got STD: {}", line);
          app.emit_all("process-stdout", ProcessOutput { line, channel_id: channel_id.clone() }).unwrap();
        }
        CommandEvent::Stderr(line) => {
          // println!("got ERR: {}", line);
          app.emit_all("process-stderr", ProcessOutput { line, channel_id: channel_id.clone() }).unwrap();
        }
        CommandEvent::Error(error) => {
          println!("error: {}", error);
        }
        _ => {}
      }
    }
  });

  return pid;
}

fn main() {
//  #[cfg(not(debug_assertions))]
//    let _guard = sentry::init(("", sentry::ClientOptions {
//    release: sentry::release_name!(),
//    // environment: "production".no_expansion(),
//    auto_session_tracking: false,
//    enable_profiling: false,
//    ..Default::default()
//  }));

  tauri::Builder::default()
    .plugin(tauri_plugin_positioner::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_log::Builder::default().targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview]).build())
    .setup(|_app| {
      // let release = sentry::release_name!().unwrap();
      // println!("Release: {}", release);
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
            open_devtools,
            init_window,
            kill_process,
            spawn_process,
        ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
