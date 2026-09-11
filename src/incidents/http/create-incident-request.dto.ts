import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';
import {
    IsIn,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';
import {
    INCIDENT_PRIORITIES,
    type IncidentPriority,
} from '../domain/incident.js';

export class CreateIncidentRequestDto {
    @ApiProperty({
        description:
            'Short summary of the operational problem',
        example: 'Sorting machine stopped',
        minLength: 5,
        maxLength: 120,
    })
    @IsString({
        message: 'title must be a string',
    })
    @Length(5, 120, {
        message:
            'title must contain 5 to 120 characters',
    })
    title!: string;

    @ApiPropertyOptional({
        description:
            'Additional information about the incident',
        example: 'Packages are backing up',
    })
    @IsOptional()
    @IsString({
        message: 'description must be a string',
    })
    description?: string;

    @ApiProperty({
        description:
            'Urgency assigned to the incident',
        enum: [...INCIDENT_PRIORITIES],
        example: 'HIGH',
    })
    @IsIn([...INCIDENT_PRIORITIES], {
        message:
            `priority must be one of: ${INCIDENT_PRIORITIES.join(', ')
            }`,
    })
    priority!: IncidentPriority;
}