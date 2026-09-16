import type { Incident } from '../domain/incident.js';

export const INCIDENT_REPOSITORY =
    Symbol('INCIDENT_REPOSITORY');

export interface IncidentRepository {
    save(incident: Incident): Promise<void>;
}