import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';
import {
    IsIn,
    IsString,
    Length,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import {
    INCIDENT_DESCRIPTION_MAX_LENGTH,
    INCIDENT_PRIORITIES,
    INCIDENT_TITLE_MAX_LENGTH,
    INCIDENT_TITLE_MIN_LENGTH,
    type IncidentPriority,
} from '../domain/incident.js';

export class CreateIncidentRequestDto {
    @ApiProperty({
        description:
            'Short summary of the operational problem',
        example: 'Sorting machine stopped',
        minLength: INCIDENT_TITLE_MIN_LENGTH,
        maxLength: INCIDENT_TITLE_MAX_LENGTH,
    })
    @IsString({
        message: 'title must be a string',
    })
    @Length(
        INCIDENT_TITLE_MIN_LENGTH,
        INCIDENT_TITLE_MAX_LENGTH,
        {
            message:
                `title must contain ${INCIDENT_TITLE_MIN_LENGTH} to ${INCIDENT_TITLE_MAX_LENGTH} characters`,
        },
    )
    title!: string;

    @ApiPropertyOptional({
        description:
            'Additional incident information',
        example: 'Packages are backing up',
        maxLength:
            INCIDENT_DESCRIPTION_MAX_LENGTH,
    })
    @ValidateIf(
        (_object, value) => value !== undefined,
    )
    @IsString({
        message: 'description must be a string',
    })
    @MaxLength(
        INCIDENT_DESCRIPTION_MAX_LENGTH,
        {
            message:
                `description cannot exceed ${INCIDENT_DESCRIPTION_MAX_LENGTH} characters`,
        },
    )
    description?: string;

    @ApiProperty({
        description:
            'Urgency assigned to the incident',
        enum: [...INCIDENT_PRIORITIES],
        example: 'HIGH',
    })
    @IsString({
        message: 'priority must be a string',
    })
    @IsIn([...INCIDENT_PRIORITIES], {
        message:
            `priority must be one of: ${INCIDENT_PRIORITIES.join(', ')}`,
    })
    priority!: IncidentPriority;
}