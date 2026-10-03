// DEV B — Phase 3 (OPTIONAL — use the desktop agent instead for most users)
// VS Code-specific heartbeat tracker. Sends richer coding signals than the agent
// (language, file extension, project name). Use alongside the agent OR as a
// standalone fallback if the user only wants to track VS Code.
//
// TODO:
//   Class Tracker
//
//   start(context: vscode.ExtensionContext):
//     Register listeners for:
//       - vscode.workspace.onDidChangeTextDocument  (user is typing)
//       - vscode.workspace.onDidSaveTextDocument    (user saved)
//       - vscode.window.onDidChangeActiveTextEditor (switched file)
//       - vscode.window.onDidChangeWindowState      (focus changed)
//     Each event handler calls this.onActivity(editor).
//
//   onActivity(editor: vscode.TextEditor | undefined):
//     - If paused, do nothing.
//     - If the last heartbeat was sent less than 30 seconds ago, do nothing (throttle).
//     - Otherwise: call sendHeartbeat(editor) and update lastSentAt.
//
//   sendHeartbeat(editor: vscode.TextEditor):
//     - Extract: project = workspace folder name, language = editor.document.languageId,
//       file_ext = path.extname(editor.document.fileName), focused = window.state.focused.
//     - Read token from SecretStorage.
//     - Call ApiClient.postHeartbeat(...) from api.ts.
//     - On error: log to console (don't crash or alert the user).
//
//   togglePause(): void   — flips the paused flag; called from statusBar.ts
//   get isPaused(): boolean
//
// Privacy: NEVER log or send full file paths, file contents, or keystrokes.
//          Only project name, language id, file extension, focused flag.

import * as vscode from 'vscode';

export class Tracker {
    // TODO: implement
}
