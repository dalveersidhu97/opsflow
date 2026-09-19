import { Provider } from "@nestjs/common";
import { Clock, CLOCK, INCIDENT_ID_GENERATOR, IncidentIdGenerator } from "../application/ports.js";
import { randomUUID } from "node:crypto";

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
    }
]