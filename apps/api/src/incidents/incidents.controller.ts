import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpStatus,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/http/api-error-response.dto.js';
import { CreateIncidentService } from './application/create-incident.service.js';
import { InputValidationError } from './domain/input-validation.error.js';
import { CreateIncidentRequestDto } from './http/create-incident-request.dto.js';
import { IncidentResponseDto } from './http/incident-response.dto.js';
import { mapIncidentResponse } from './http/map-incident-response.js';
import { ListIncidentsQueryDto } from './http/list-incidents-query.dto.js';
import { ListIncidentsService } from './application/list-incidents.service.js';
import { ListIncidentsResponseDto } from './http/list-incidents-response.dto.js';

const DEMO_AUTHENTICATED_REPORTER_ID =
    'demo-user-001';

@ApiTags('incidents')
@Controller({
    path: 'incidents',
    version: '1',
})
export class IncidentsController {
    constructor(
        private readonly createIncidentService: CreateIncidentService,
        private readonly listIncidentService: ListIncidentsService
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
    async create(
        @Body()
        body: CreateIncidentRequestDto,
    ): Promise<IncidentResponseDto> {
        try {
            const incident =
                await this.createIncidentService.execute(
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

    @ApiOperation({
        summary: 'List incidents',
    })
    @ApiOkResponse({
        description:
            'The incident was created successfully.',
        type: ListIncidentsResponseDto,
    })
    @ApiBadRequestResponse({
        description: 'The request is invalid.',
        type: ApiErrorResponseDto,
    })
    @Get()
    async listIncidents(@Query() listIncidentInput: ListIncidentsQueryDto): Promise<ListIncidentsResponseDto> {
        const { incidents, nextCursor } = (await this.listIncidentService.list(listIncidentInput));
        return { items: incidents.map(mapIncidentResponse), nextCursor };
    }
}