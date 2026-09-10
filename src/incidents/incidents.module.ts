import { Module } from "@nestjs/common";
import { IncidentsController } from "./incidents.controller.js";
import { CreateIncidentService } from "./application/create-incident.service.js";
import { incidentInfrastructureProviders } from "./infrastructure/incident.providers.js";


@Module({
    controllers: [IncidentsController],
    providers: [
        CreateIncidentService,
        ...incidentInfrastructureProviders
    ]
})
export class IncidentsModule { }