// DEV B — Phase 3
// Status bar item: shows today's tracked time and toggles pause/resume on click.
//
// TODO:
//   Class TrackerStatusBar
//
//   constructor(tracker: Tracker):
//     - Create a vscode.StatusBarItem (alignment: Left, priority: 100).
//     - Set command to "volunteerTracker.togglePause" (register this command here).
//     - Show the item.
//
//   update(todayMinutes: number):
//     - If tracker.isPaused: show "$(debug-pause) Tracker paused"
//     - Else: show "$(clock) Xh Ym" (format todayMinutes as hours + minutes)
//
//   startPolling():
//     - Every 60 seconds, call GET /hours for today and call update() with the result.
//     - Store the interval handle so it can be cleared in dispose().
//
//   dispose(): clean up the status bar item and clear the polling interval.

import * as vscode from 'vscode';
import { Tracker } from './tracker';

export class TrackerStatusBar {
    // TODO: implement
}
