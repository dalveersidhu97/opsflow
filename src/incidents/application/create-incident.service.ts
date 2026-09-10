import { Inject, Injectable } from "@nestjs/common";
import { type Clock, CLOCK, INCIDENT_ID_GENERATOR, type IncidentIdGenerator } from "./ports.js";
import { type Incident } from "../domain/incident.js";
import { createIncident } from "../domain/create-incident.js";

@Injectable()
export class CreateIncidentService {
    constructor(
        @Inject(INCIDENT_ID_GENERATOR)
        private readonly idGenerator: IncidentIdGenerator,

        @Inject(CLOCK)
        private readonly clock: Clock,
    ) { }

    execute(rawBody: unknown, authenticatedReporterId: string): Incident {
        return createIncident(
            rawBody,
            authenticatedReporterId,
            {
                newId: () => this.idGenerator.newId(),
                now: () => this.clock.now(),
            },
        );
    }
}