import { Inject, Injectable } from "@nestjs/common";
import { FindIncidentPageInput, INCIDENT_REPOSITORY, type IncidentRepository } from "./incident.repository.js";
import { Incident } from "../domain/incident.js";
import { encodeIncidentCursor } from "../infrastructure/incident-cursor.js";

@Injectable()
export class ListIncidentsService {
    constructor(
        @Inject(INCIDENT_REPOSITORY)
        private readonly incidentRepository:
            IncidentRepository,
    ) { }

    async list(
        input: FindIncidentPageInput
    ): Promise<{ incidents: Incident[], nextCursor: string | null }> {
        const { limit } = input;
        const incidents = await this.incidentRepository.findPage(input);
        const nextCursor = incidents.length > limit ? encodeIncidentCursor({ createdAt: incidents[limit].createdAt, id: incidents[limit].id }) : null;
        return { nextCursor, incidents: incidents.slice(0, limit) };
    }
}