// apps/web/src/api/incidents.ts

export type IncidentPriority =
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'CRITICAL';

export interface Incident {
    id: string;
    title: string;
    description: string | null;
    priority: IncidentPriority;
    status: 'OPEN';
    reporterId: string;
    createdAt: string;
}

export interface IncidentPage {
    incidents: Incident[];
    nextCursor: string | null;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchIncidents(
    cursor?: string,
): Promise<IncidentPage> {
    const url = new URL(
        '/v1/incidents',
        API_URL,
    );

    url.searchParams.set('limit', '20');

    if (cursor) {
        url.searchParams.set(
            'cursor',
            cursor,
        );
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Unable to load incidents: ${response.status}`,
        );
    }

    return response.json() as
        Promise<IncidentPage>;
}