# Extension — Dev Notes

This is an optional VS Code extension that supplements the desktop agent with richer coding signals (language, file extension, project name). The desktop agent already tracks VS Code as an app — this extension adds the per-file detail on top.

---

## Setup

```bash
npm install
# Press F5 in VS Code to launch the Extension Development Host
# Or: npm run compile && code --install-extension runtime-0.0.1.vsix
```

---

## Files

| File | What it does |
|------|-------------|
| `src/extension.ts` | Entry point — `activate()` and `deactivate()` |
| `src/tracker.ts` | Listens for editor events, throttles, sends heartbeats |
| `src/statusBar.ts` | Status bar item: shows today's minutes, toggles pause |
| `src/api.ts` | `fetch` wrapper for `POST /heartbeat` and `GET /hours` |

---

## extension.ts

`activate(context)` needs to:

1. Instantiate `Tracker` and `TrackerStatusBar`
2. Register the `runtime.setToken` command:
   ```ts
   vscode.commands.registerCommand('runtime.setToken', async () => {
     const token = await vscode.window.showInputBox({ prompt: 'Paste your Runtime API token' })
     if (token) await context.secrets.store('runtime.token', token)
   })
   ```
3. Call `tracker.start(context)`
4. Push all disposables into `context.subscriptions`

`deactivate()` calls `tracker.stop()`.

---

## tracker.ts

Three things: listen → throttle → send.

**Listen** — register these four VS Code events:
```ts
vscode.workspace.onDidChangeTextDocument(e => onActivity(e.document))
vscode.workspace.onDidSaveTextDocument(doc => onActivity(doc))
vscode.window.onDidChangeActiveTextEditor(e => onActivity(e?.document))
vscode.window.onDidChangeWindowState(s => { focused = s.focused })
```

**Throttle** — only send if 30+ seconds have passed since the last heartbeat. Store `lastSentAt: number` (epoch ms).

**Send** — call `ApiClient.postHeartbeat(token, payload)` with:
```ts
{
  app_name:   'Visual Studio Code',
  app_bundle: 'com.microsoft.VSCode',
  focused:    window.state.focused,
  project:    vscode.workspace.workspaceFolders?.[0]?.name ?? null,
  language:   document.languageId,
  file_ext:   path.extname(document.fileName) || null,
}
```

**Privacy rule:** never send full file paths or file contents — only the extension (`.py`, `.ts`) and language id.

**Pause/resume** — expose `togglePause()` and `isPaused` for the status bar to call.

**Token** — read with `context.secrets.get('runtime.token')` inside `postHeartbeat`. If empty, skip silently.

---

## statusBar.ts

```ts
const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
item.command = 'runtime.togglePause'
item.show()
```

Register `runtime.togglePause` command here — calls `tracker.togglePause()` and updates the item text.

**Text format:**
- Active: `$(clock) 1h 23m`
- Paused: `$(debug-pause) Paused`

**Polling:** call `ApiClient.getTodayMinutes()` every 60 seconds and update the item text. Use `setInterval` and clear it in `dispose()`.

`$(clock)` and `$(debug-pause)` are VS Code icon IDs — they render as icons in the status bar automatically.

---

## api.ts

Read the server URL from settings:
```ts
vscode.workspace.getConfiguration('runtime').get<string>('serverUrl', 'http://localhost:8000')
```

**`postHeartbeat(token, payload)`**
```ts
POST <serverUrl>/heartbeat
Authorization: Bearer <token>
Content-Type: application/json
body: JSON.stringify(payload)
```
Throw on non-2xx so `tracker.ts` can catch and log to `console.error`. Never show an error notification to the user for a failed heartbeat.

**`getTodayMinutes(token)`**
```ts
GET <serverUrl>/hours?user_id=<userId>&from_=<today>&to=<today>
```
Returns `DailyHours[]` — grab `rows[0]?.tracked_minutes ?? 0`. 

Note: `user_id` isn't stored locally right now. Either add a `GET /me` endpoint (ask Dev A) or skip the hours display for now and just show "tracking active."

---

## Packaging

```bash
npm run package    # produces runtime-0.0.1.vsix
```

Install in VS Code: `Extensions → ··· → Install from VSIX`

The `contributes.commands` and `contributes.configuration` are already defined in `package.json` — don't rename the command IDs or config keys without updating both.

---

## Things to watch out for

**SecretStorage vs settings:** the token goes in `context.secrets` (encrypted), not `settings.json` (plaintext). Never log or show the raw token.

**Extension host ≠ Node.js:** `fetch` is available (VS Code ships with Node 18+), but `require('fs')` etc. work fine too. No browser globals.

**`path.extname`** needs `import * as path from 'path'` — it's Node's path module, not a browser API.

**The desktop agent runs separately.** If a volunteer has both the agent and the extension running, the backend may receive two heartbeats for VS Code — one from the agent (`app_name: "Visual Studio Code"`, no coding detail) and one from the extension (with `language`, `file_ext`). The backend deduplicates naturally via the 30s rate limit per token. No action needed.
