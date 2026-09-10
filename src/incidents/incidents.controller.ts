import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { CreateIncidentService } from "./application/create-incident.service.js";
import type { Incident } from "./domain/incident.js";
import { InputValidationError } from "./domain/input-validation.error.js";

const DEMO_AUTHENTICATED_REPORTER_ID =
    'demo-user-001';

@Controller('incidents')
export class IncidentsController {
    constructor(private readonly createIncidentService: CreateIncidentService) { }

    @Post()
    create(@Body() rawBody: unknown,): Incident {
        try {
            return this.createIncidentService.execute(rawBody, DEMO_AUTHENTICATED_REPORTER_ID)
        } catch (error: unknown) {
            if (error instanceof InputValidationError)
                throw new BadRequestException({
                    code: 'INCIDENT_INPUT_INVALID',
                    message: 'Incident input is invalid',
                    issues: error.issues,
                });

            throw error;
        }
    }
}