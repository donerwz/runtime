import * as vscode from 'vscode';
import { TrackerStatusBar } from './statusBar';
import { Tracker } from './tracker';

let tracker: Tracker | undefined;

export function activate(context: vscode.ExtensionContext): void {
    tracker = new Tracker();
    const statusBar = new TrackerStatusBar(tracker);
    context.subscriptions.push(statusBar);

    context.subscriptions.push(vscode.commands.registerCommand('runtime.setToken', async () => {
        const token = await vscode.window.showInputBox({
            prompt: 'Paste your Runtime API token',
            password: true,
            ignoreFocusOut: true,
        });
        if (token?.trim()) {
            await context.secrets.store('runtime.token', token.trim());
            void vscode.window.showInformationMessage('Token saved.');
        }
    }));

    tracker.start(context);
}

export function deactivate(): void {
    tracker?.stop();
    tracker = undefined;
}
