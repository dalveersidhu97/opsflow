import { ApiProperty } from '@nestjs/swagger';
import {
    INCIDENT_PRIORITIES,
    type Incident,
    type IncidentPriority,
} from '../domain/incident.js';

export class IncidentResponseDto
    implements Incident {
    @ApiProperty({
        description:
            'Unique incident identifier',
        example:
            'e2576e72-a55f-4317-a7bb-f08f61c77dce',
    })
    id!: string;

    @ApiProperty({
        example: 'Sorting machine stopped',
    })
    title!: string;

    @ApiProperty({
        type: String,
        nullable: true,
        example: 'Packages are backing up',
    })
    description!: string | null;

    @ApiProperty({
        enum: [...INCIDENT_PRIORITIES],
        example: 'HIGH',
    })
    priority!: IncidentPriority;

    @ApiProperty({
        example: 'OPEN',
    })
    status!: Incident['status'];

    @ApiProperty({
        description:
            'Server-controlled reporter identity',
        example: 'demo-user-001',
    })
    reporterId!: string;

    @ApiProperty({
        format: 'date-time',
        example:
            '2026-09-14T16:00:00.000Z',
    })
    createdAt!: string;
}