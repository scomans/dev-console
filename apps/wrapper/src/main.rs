#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]


use std::collections::{HashMap, HashSet};

use specta::{collect_types, Type};
use sysinfo::{Pid, Signal, System};
use tauri::{AppHandle, Manager, Window, Wry};
use tauri::api::process::{Command, CommandEvent, Encoding};
use tauri_specta::ts;

#[derive(Clone, serde::Serialize, Type)]
struct ProcessOutput {
  channel_id: String,
  line: String,
}

#[derive(Clone, serde::Serialize, Type)]
struct ProcessExit {
  channel_id: String,
  code: i32,
}

#[tauri::command]
#[specta::specta]
fn open_devtools(window: Window<Wry>) {
  window.open_devtools();
}

#[tauri::command]
#[specta::specta]
async fn kill_process(pid: u32) -> Vec<u32> {
  let mut system = System::new();
  system.refresh_all();

  let p = Pid::from(pid as usize);

  if let Some(process) = system.process(p) {
    let processes = system.processes();

    let mut parent_set = HashSet::from([pid]);
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
#[specta::specta]
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
  #[cfg(debug_assertions)]
  ts::export(
    collect_types![open_devtools, kill_process, spawn_process],
    "../frontend/src/app/types/tauri.ts",
  ).unwrap();

//  #[cfg(not(debug_assertions))]
//    let _guard = sentry::init(("", sentry::ClientOptions {
//    release: sentry::release_name!(),
//    // environment: "production".no_expansion(),
//    auto_session_tracking: false,
//    enable_profiling: false,
//    ..Default::default()
//  }));

  tauri::Builder::default()
    .setup(|_app| {
      // let release = sentry::release_name!().unwrap();
      // println!("Release: {}", release);
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
            open_devtools,
            kill_process,
            spawn_process,
        ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
