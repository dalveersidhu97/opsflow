import {
    BadRequestException,
    Body,
    Controller,
    HttpStatus,
    Post,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/http/api-error-response.dto.js';
import { CreateIncidentService } from './application/create-incident.service.js';
import { InputValidationError } from './domain/input-validation.error.js';
import { CreateIncidentRequestDto } from './http/create-incident-request.dto.js';
import { IncidentResponseDto } from './http/incident-response.dto.js';
import { mapIncidentResponse } from './http/map-incident-response.js';

const DEMO_AUTHENTICATED_REPORTER_ID =
    'demo-user-001';

@ApiTags('incidents')
@Controller({
    path: 'incidents',
    version: '1',
})
export class IncidentsController {
    constructor(
        private readonly createIncidentService:
            CreateIncidentService,
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Create an incident',
    })
    @ApiCreatedResponse({
        description:
            'The incident was created successfully.',
        type: IncidentResponseDto,
    })
    @ApiBadRequestResponse({
        description:
            'The request or incident data is invalid.',
        type: ApiErrorResponseDto,
    })
    create(
        @Body()
        body: CreateIncidentRequestDto,
    ): IncidentResponseDto {
        try {
            const incident =
                this.createIncidentService.execute(
                    body,
                    DEMO_AUTHENTICATED_REPORTER_ID,
                );

            return mapIncidentResponse(incident);
        } catch (error: unknown) {
            if (
                error instanceof
                InputValidationError
            ) {
                throw new BadRequestException({
                    statusCode:
                        HttpStatus.BAD_REQUEST,
                    code: 'INCIDENT_INPUT_INVALID',
                    message:
                        'Incident input is invalid',
                    issues: error.issues,
                });
            }

            throw error;
        }
    }
}