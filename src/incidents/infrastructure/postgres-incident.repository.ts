import { Injectable } from '@nestjs/common';
import { PostgresDatabase } from '../../database/postgres-database.js';
import type { IncidentRepository } from '../application/incident.repository.js';
import type { Incident } from '../domain/incident.js';

@Injectable()
export class PostgresIncidentRepository
    implements IncidentRepository {
    constructor(
        private readonly database:
            PostgresDatabase,
    ) { }

    async save(
        incident: Incident,
    ): Promise<void> {
        await this.database.query(
            `
        INSERT INTO incidents (
          id,
          title,
          description,
          priority,
          status,
          reporter_id,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
      `,
            [
                incident.id,
                incident.title,
                incident.description,
                incident.priority,
                incident.status,
                incident.reporterId,
                incident.createdAt,
            ],
        );
    }
}