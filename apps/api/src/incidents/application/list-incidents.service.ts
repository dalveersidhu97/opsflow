import { Inject, Injectable } from "@nestjs/common";
import { FindIncidentPageInput, INCIDENT_REPOSITORY, type IncidentRepository } from "./incident.repository.js";
import { Incident } from "../domain/incident.js";
import { decodeIncidentCursor, encodeIncidentCursor } from "./incident-cursor.js";

@Injectable()
export class ListIncidentsService {
    constructor(
        @Inject(INCIDENT_REPOSITORY)
        private readonly incidentRepository:
            IncidentRepository,
    ) { }

    async list(
        input: { limit: number; cursor?: string },
    ): Promise<{ incidents: Incident[]; nextCursor: string | null }> {

        const { limit } = input;

        const repositoryInput: FindIncidentPageInput = {
            limit: limit + 1,
            cursor: input.cursor
                ? decodeIncidentCursor(input.cursor)
                : null,
        };

        const incidents =
            await this.incidentRepository.findPage(repositoryInput);

        const nextCursor =
            incidents.length > limit
                ? encodeIncidentCursor({
                    createdAt: incidents[limit - 1].createdAt,
                    id: incidents[limit - 1].id,
                })
                : null;

        return {
            incidents: incidents.slice(0, limit),
            nextCursor,
        };
    }
}