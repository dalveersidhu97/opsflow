import { IncidentCursor } from "./incident.repository.js";
export interface IncidentCursorEncoder {
    encode: (cursor: IncidentCursor) => string
}

export interface IncidentCursorDecoder {
    decode: (cursorBase64: string) => IncidentCursor
}

export const INCIDENT_CURSOR_ENCODER = Symbol('INCIDENT_CURSOR_ENCODER');

export const INCIDENT_CURSOR_DENCODER = Symbol('INCIDENT_CURSOR_DENCODER');
