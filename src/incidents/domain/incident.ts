export const INCIDENT_PRIORITIES = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
] as const;

export type IncidentPriority =
    (typeof INCIDENT_PRIORITIES)[number];

export type IncidentStatus = 'OPEN';

export interface CreateIncidentInput {
    readonly title: string;
    readonly description: string | null;
    readonly priority: IncidentPriority;
}

export interface Incident extends CreateIncidentInput {
    readonly id: string;
    readonly status: IncidentStatus;
    readonly reporterId: string;
    readonly createdAt: string;
}