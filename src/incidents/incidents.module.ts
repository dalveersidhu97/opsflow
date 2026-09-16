import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import {
    INCIDENT_REPOSITORY,
} from './application/incident.repository.js';
import { CreateIncidentService } from './application/create-incident.service.js';
import { IncidentsController } from './incidents.controller.js';
import { incidentProviders } from './infrastructure/incident.providers.js';
import { PostgresIncidentRepository } from './infrastructure/postgres-incident.repository.js';

@Module({
    imports: [DatabaseModule],
    controllers: [IncidentsController],
    providers: [
        CreateIncidentService,
        ...incidentProviders,
        {
            provide: INCIDENT_REPOSITORY,
            useClass:
                PostgresIncidentRepository,
        },
    ],
})
export class IncidentsModule { }