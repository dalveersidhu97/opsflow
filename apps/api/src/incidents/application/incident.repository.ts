import type { Incident } from '../domain/incident.js';

export const INCIDENT_REPOSITORY =
    Symbol('INCIDENT_REPOSITORY');

export interface IncidentCursor {
    readonly createdAt: string;
    readonly id: string;
}

export interface FindIncidentPageInput {
    readonly limit: number;
    readonly cursor: IncidentCursor | null;
}

export interface IncidentRepository {
    save(incident: Incident): Promise<void>;
    findPage(
        input: FindIncidentPageInput,
    ): Promise<Incident[]>;
}