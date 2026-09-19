import type { Incident } from '../domain/incident.js';
import type { IncidentResponseDto } from './incident-response.dto.js';

export function mapIncidentResponse(
    incident: Incident,
): IncidentResponseDto {
    return {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        priority: incident.priority,
        status: incident.status,
        reporterId: incident.reporterId,
        createdAt: incident.createdAt,
    };
}