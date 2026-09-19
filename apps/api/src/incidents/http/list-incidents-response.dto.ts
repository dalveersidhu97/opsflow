import { ApiProperty } from "@nestjs/swagger";
import { IncidentResponseDto } from "./incident-response.dto.js";


export class ListIncidentsResponseDto {
    @ApiProperty({
        description: 'Incidents array'
    })
    incidents: IncidentResponseDto[];
    @ApiProperty({
        description: 'Base64 Url encoded cursor json',
        example: '45k6jh6h4kjh5kjhj7kjhjhj4754h45kl6h',
    })
    nextCursor: string | null;
}