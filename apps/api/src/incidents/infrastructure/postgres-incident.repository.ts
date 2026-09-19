import { Injectable } from '@nestjs/common';
import { PostgresDatabase } from '../../database/postgres-database.js';
import type { FindIncidentPageInput, IncidentRepository } from '../application/incident.repository.js';
import type { Incident } from '../domain/incident.js';

@Injectable()
export class PostgresIncidentRepository
    implements IncidentRepository {
    constructor(
        private readonly database:
            PostgresDatabase,
    ) { }
    async findPage(input: FindIncidentPageInput): Promise<Incident[]> {
        const hasCursor = !!input.cursor;

        const queryText = `
        SELECT
            id,
            title,
            description,
            priority,
            status,
            reporter_id AS "reporterId",
            created_at AS "createdAt"
        FROM incidents
        ${hasCursor ? 'WHERE (created_at, id) < ($1, $2)' : ''}
        ORDER BY created_at DESC, id DESC
        LIMIT $${hasCursor ? 3 : 1};
    `;

        const queryParams = hasCursor
            ? [input.cursor!.createdAt, input.cursor!.id, input.limit + 1]
            : [input.limit + 1];

        const result = await this.database.query<Incident & { createdAt: Date }>(
            queryText,
            queryParams,
        );

        const incidents: Incident[] = result.rows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
        }));
        return incidents;
    }

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