// DEV B — Phase 3
// HTTP client for the FastAPI backend. Read api-contract.md for endpoint shapes.
//
// TODO:
//   Use the built-in fetch API (Node 18+ / VS Code's environment has it).
//   Read the server URL from vscode.workspace.getConfiguration("volunteerTracker").serverUrl.
//
//   postHeartbeat(token: string, payload: HeartbeatPayload): Promise<void>
//     POST <serverUrl>/heartbeat
//     Headers: Authorization: Bearer <token>, Content-Type: application/json
//     Body: JSON.stringify(payload)
//     Throw on non-2xx so tracker.ts can catch and log.
//
//   getTodayMinutes(token: string, userId: string): Promise<number>
//     GET <serverUrl>/hours?user_id=<userId>&from=<today>&to=<today>
//     Return the tracked_minutes for today, or 0 if the list is empty.
//
// Types:
//   interface HeartbeatPayload {
//     project:  string;
//     language: string;
//     file_ext: string;
//     focused:  boolean;
//   }
