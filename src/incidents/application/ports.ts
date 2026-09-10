export interface Clock {
    now(): Date;
}

export interface IncidentIdGenerator {
    newId(): string;
}

export const CLOCK = Symbol('CLOCK');

export const INCIDENT_ID_GENERATOR = Symbol('INCIDENT_ID_GENERATOR');