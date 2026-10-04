import * as vscode from 'vscode';
import { Tracker } from './tracker';

export class TrackerStatusBar implements vscode.Disposable {
    private readonly item: vscode.StatusBarItem;
    private readonly command: vscode.Disposable;

    constructor(private readonly tracker: Tracker) {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.item.command = 'runtime.togglePause';
        this.command = vscode.commands.registerCommand('runtime.togglePause', () => {
            this.tracker.togglePause();
            this.update();
        });
        this.update();
        this.item.show();
    }

    update(): void {
        this.item.text = this.tracker.isPaused
            ? '$(debug-pause) Paused'
            : '$(clock) Runtime tracking active';
        this.item.tooltip = 'Click to pause or resume Runtime tracking';
    }

    dispose(): void {
        this.command.dispose();
        this.item.dispose();
    }
}
