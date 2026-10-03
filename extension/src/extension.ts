// DEV B — Phase 3
// Extension entry point. VS Code calls activate() when the extension loads.
//
// TODO:
//   1. In activate():
//      a. Instantiate Tracker (tracker.ts) and StatusBarItem (statusBar.ts).
//      b. Register the "runtime.setToken" command:
//           - Prompt the user for their token via vscode.window.showInputBox.
//           - Store it with context.secrets.store("runtime.token", token).
//           - Show an info message: "Token saved."
//      c. Call tracker.start() to begin listening for events.
//      d. Push all disposables into context.subscriptions.
//
//   2. In deactivate():
//      - Call tracker.stop() to clean up listeners and clear the throttle timer.
//
// Acceptance: pressing F5 launches the extension host without errors.
//             Running "Set API Token" saves the token to SecretStorage.

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // TODO: implement as described above
}

export function deactivate() {
    // TODO: call tracker.stop()
}
