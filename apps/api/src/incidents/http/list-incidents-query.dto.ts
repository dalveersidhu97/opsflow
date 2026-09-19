import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { INCIDENT_DEFAULT_LIMIT, INCIDENT_MAX_LIMIT, INCIDENT_MIN_LIMIT } from "../constants/incident-pagination-contants.js";

export class ListIncidentsQueryDto {
    @ApiPropertyOptional({
        description: 'Base64 encoded cursor string',
    })
    @IsOptional()
    @IsString({ message: 'cursor must be a string' })
    cursor?: string;

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