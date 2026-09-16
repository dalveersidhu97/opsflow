import {
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    createIncident,
} from '../domain/create-incident.js';
import type { Incident } from '../domain/incident.js';
import {
    INCIDENT_REPOSITORY,
    type IncidentRepository,
} from './incident.repository.js';
import {
    CLOCK,
    INCIDENT_ID_GENERATOR,
    type Clock,
    type IncidentIdGenerator,
} from './ports.js';

@Injectable()
export class CreateIncidentService {
    constructor(
        @Inject(CLOCK)
        private readonly clock: Clock,

        @Inject(INCIDENT_ID_GENERATOR)
        private readonly idGenerator:
            IncidentIdGenerator,

        @Inject(INCIDENT_REPOSITORY)
        private readonly incidentRepository:
            IncidentRepository,
    ) { }

    async execute(
        raw: unknown,
        authenticatedReporterId: string,
    ): Promise<Incident> {
        const incident = createIncident(
            raw,
            authenticatedReporterId,
            {
                now: () => this.clock.now(),
                newId: () =>
                    this.idGenerator.newId(),
            },
        );

        await this.incidentRepository.save(
            incident,
        );

        return incident;
    }
}