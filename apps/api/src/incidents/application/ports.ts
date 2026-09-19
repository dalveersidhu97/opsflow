import { IncidentCursor } from "./incident.repository.js";

export interface Clock {
    now(): Date;
}

export interface IncidentIdGenerator {
    newId(): string;
}

export interface IncidentCursorEncoder {
    encode: (cursor: IncidentCursor) => string
}

export interface IncidentCursorDecoder {
    decode: (cursorBase64: string) => IncidentCursor
}

export const CLOCK = Symbol('CLOCK');

export const INCIDENT_ID_GENERATOR = Symbol('INCIDENT_ID_GENERATOR');

export const INCIDENT_CURSOR_ENCODER = Symbol('INCIDENT_CURSOR_ENCODER');

export const INCIDENT_CURSOR_DENCODER = Symbol('INCIDENT_CURSOR_DENCODER');