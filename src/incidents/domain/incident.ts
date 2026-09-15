export const INCIDENT_PRIORITIES = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
] as const;

export const INCIDENT_TITLE_MIN_LENGTH = 5;
export const INCIDENT_TITLE_MAX_LENGTH = 120;

export const INCIDENT_DESCRIPTION_MAX_LENGTH =
    2_000;

export type IncidentPriority =
    (typeof INCIDENT_PRIORITIES)[number];

export type IncidentStatus = 'OPEN';

export interface CreateIncidentInput {
    readonly title: string;
    readonly description: string | null;
    readonly priority: IncidentPriority;
}

export interface Incident
    extends CreateIncidentInput {
    readonly id: string;
    readonly status: IncidentStatus;
    readonly reporterId: string;
    readonly createdAt: string;
}