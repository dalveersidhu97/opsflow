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
import { CreateIncidentService } from './application/create-incident.service.js';
import { InputValidationError } from './domain/input-validation.error.js';
import { CreateIncidentRequestDto } from './http/create-incident-request.dto.js';
import { IncidentResponseDto } from './http/incident-response.dto.js';

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
        description:
            'Creates an open incident for the authenticated reporter.',
    })
    @ApiCreatedResponse({
        description:
            'The incident was created successfully.',
        type: IncidentResponseDto,
    })
    @ApiBadRequestResponse({
        description:
            'The request or incident data is invalid.',
        schema: {
            example: {
                statusCode: 400,
                code: 'REQUEST_VALIDATION_FAILED',
                message: 'Request validation failed',
                issues: [
                    'title must contain 5 to 120 characters',
                ],
            },
        },
    })
    create(
        @Body()
        body: CreateIncidentRequestDto,
    ): IncidentResponseDto {
        try {
            return this.createIncidentService.execute(
                body,
                DEMO_AUTHENTICATED_REPORTER_ID,
            );
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