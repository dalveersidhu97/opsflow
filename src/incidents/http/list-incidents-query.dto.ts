import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { FindIncidentPageInput, type IncidentCursor } from "../application/incident.repository.js";
import { plainToInstance, Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { decodeIncidentCursor } from "../infrastructure/incident-cursor.js";
import { INCIDENT_DEFAULT_LIMIT, INCIDENT_MAX_LIMIT, INCIDENT_MIN_LIMIT } from "../constants/incident-pagination-contants.js";

class CursorDto implements IncidentCursor {
    @IsNotEmpty()
    @IsDateString()
    createdAt: string;

    @IsString()
    @IsNotEmpty()
    id: string;
}

export class ListIncidentsQueryDto implements FindIncidentPageInput {
    @ApiPropertyOptional({
        description: 'Base64 encoded cursor JSON',
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined) {
            return null;
        }

        try {
            const decoded = decodeIncidentCursor(value);
            return plainToInstance(CursorDto, decoded);
        } catch {
            return value;
        }
    })
    @ValidateNested({
        message: 'Invalid cursor',
    })
    cursor: CursorDto | null;

    @ApiPropertyOptional({
        default: INCIDENT_DEFAULT_LIMIT,
        description: 'Number of maximum items return per page.',
        example: 20,
        maximum: INCIDENT_MAX_LIMIT,
        minimum: INCIDENT_MIN_LIMIT
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(INCIDENT_MIN_LIMIT, { message: `Limit must be at least ${INCIDENT_MIN_LIMIT}` })
    @Max(INCIDENT_MAX_LIMIT, { message: `Limit must not exceed ${INCIDENT_MAX_LIMIT}` })
    limit: number = INCIDENT_DEFAULT_LIMIT;
}