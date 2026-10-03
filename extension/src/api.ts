import * as vscode from 'vscode';

export interface HeartbeatPayload {
    app_name: string;
    app_bundle: string | null;
    focused: boolean;
    project: string | null;
    language: string | null;
    file_ext: string | null;
}

interface DailyHours {
    date: string;
    tracked_minutes: number;
}

function serverUrl(): string {
    return vscode.workspace.getConfiguration('runtime')
        .get<string>('serverUrl', 'http://localhost:8000').replace(/\/$/, '');
}

export class ApiClient {
    static async postHeartbeat(token: string, payload: HeartbeatPayload): Promise<void> {
        const response = await fetch(`${serverUrl()}/heartbeat`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Heartbeat request failed (${response.status})`);
        }
    }

    static async getTodayMinutes(token: string, userId: string): Promise<number> {
        const today = new Date().toISOString().slice(0, 10);
        const query = new URLSearchParams({ user_id: userId, from: today, to: today });
        const response = await fetch(`${serverUrl()}/hours?${query}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`Hours request failed (${response.status})`);
        }

        const rows = await response.json() as DailyHours[];
        return rows[0]?.tracked_minutes ?? 0;
    }
}
