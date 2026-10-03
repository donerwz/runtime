import * as path from 'path';
import * as vscode from 'vscode';
import { ApiClient, HeartbeatPayload } from './api';

const HEARTBEAT_INTERVAL_MS = 30_000;

export class Tracker {
    private paused = false;
    private lastSentAt = 0;
    private readonly disposables: vscode.Disposable[] = [];
    private context?: vscode.ExtensionContext;

    start(context: vscode.ExtensionContext): void {
        this.context = context;
        const activity = (document: vscode.TextDocument | undefined) => {
            void this.onActivity(document);
        };

        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(event => activity(event.document)),
            vscode.workspace.onDidSaveTextDocument(document => activity(document)),
            vscode.window.onDidChangeActiveTextEditor(editor => activity(editor?.document)),
            vscode.window.onDidChangeWindowState(() => activity(vscode.window.activeTextEditor?.document)),
        );

        activity(vscode.window.activeTextEditor?.document);
    }

    private async onActivity(document: vscode.TextDocument | undefined): Promise<void> {
        if (this.paused || !document || document.uri.scheme !== 'file') {
            return;
        }

        const now = Date.now();
        if (now - this.lastSentAt < HEARTBEAT_INTERVAL_MS) {
            return;
        }
        this.lastSentAt = now;
        await this.sendHeartbeat(document);
    }

    private async sendHeartbeat(document: vscode.TextDocument): Promise<void> {
        if (!this.context) {
            return;
        }

        try {
            const token = await this.context.secrets.get('runtime.token');
            if (!token) {
                return;
            }

            const folder = vscode.workspace.getWorkspaceFolder(document.uri);
            const extension = path.extname(document.fileName);
            const payload: HeartbeatPayload = {
                app_name: 'Visual Studio Code',
                app_bundle: 'com.microsoft.VSCode',
                focused: vscode.window.state.focused,
                project: folder?.name ?? null,
                language: document.languageId || null,
                file_ext: extension || null,
            };

            await ApiClient.postHeartbeat(token, payload);
        } catch (error) {
            // Do not include document paths or tokens in logs.
            console.error('Runtime heartbeat failed:', error instanceof Error ? error.message : 'unknown error');
        }
    }

    togglePause(): void {
        this.paused = !this.paused;
    }

    get isPaused(): boolean {
        return this.paused;
    }

    stop(): void {
        for (const disposable of this.disposables.splice(0)) {
            disposable.dispose();
        }
        this.context = undefined;
    }
}
