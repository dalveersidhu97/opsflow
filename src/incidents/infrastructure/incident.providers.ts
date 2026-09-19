import { Provider } from "@nestjs/common";
import { Clock, CLOCK, INCIDENT_CURSOR_DENCODER, INCIDENT_CURSOR_ENCODER, INCIDENT_ID_GENERATOR, IncidentCursorDecoder, IncidentCursorEncoder, IncidentIdGenerator } from "../application/ports.js";
import { randomUUID } from "node:crypto";
import { decodeIncidentCursor, encodeIncidentCursor } from "./incident-cursor.js";

export const incidentProviders: Provider[] = [
    {
        provide: CLOCK,
        useValue: {
            now: () => new Date()
        } satisfies Clock
    },
    {
        provide: INCIDENT_ID_GENERATOR,
        useValue: {
            newId: () => randomUUID()
        } satisfies IncidentIdGenerator
    },
    {
        provide: INCIDENT_CURSOR_DENCODER,
        useValue: {
            decode: decodeIncidentCursor
        } satisfies IncidentCursorDecoder
    },
    {
        provide: INCIDENT_CURSOR_ENCODER,
        useValue: {
            encode: encodeIncidentCursor
        } satisfies IncidentCursorEncoder
    }
]