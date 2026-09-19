import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';
import { PostgresDatabase } from '../src/database/postgres-database.js';
import type { Incident } from '../src/incidents/domain/incident.js';
import { PostgresIncidentRepository } from '../src/incidents/infrastructure/postgres-incident.repository.js';

interface StoredIncidentRow {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    reporter_id: string;
    created_at: Date;
}

const describeWithDatabase =
    process.env.DATABASE_URL
        ? describe
        : describe.skip;

describeWithDatabase(
    'PostgresIncidentRepository',
    () => {
        let database: PostgresDatabase;
        let repository:
            PostgresIncidentRepository;

        beforeAll(() => {
            database = new PostgresDatabase();
            repository =
                new PostgresIncidentRepository(
                    database,
                );
        });

        beforeEach(async () => {
            await database.query(
                'TRUNCATE TABLE incidents',
            );
        });

        afterAll(async () => {
            await database.onModuleDestroy();
        });

        it(
            'persists the complete incident mapping',
            async () => {
                const incident: Incident = {
                    id:
                        'e2576e72-a55f-4317-a7bb-f08f61c77dce',
                    title: 'Scanner unavailable',
                    description: 'Station 14',
                    priority: 'HIGH',
                    status: 'OPEN',
                    reporterId: 'demo-user-001',
                    createdAt:
                        '2026-09-15T16:00:00.000Z',
                };

                await repository.save(incident);

                const result =
                    await database
                        .query<StoredIncidentRow>(
                            `
                SELECT
                  id,
                  title,
                  description,
                  priority,
                  status,
                  reporter_id,
                  created_at
                FROM incidents
                WHERE id = $1
              `,
                            [incident.id],
                        );

                expect(result.rowCount).toBe(1);

                const stored = result.rows[0];

                expect(stored).toBeDefined();
                expect(stored?.id).toBe(
                    incident.id,
                );
                expect(stored?.title).toBe(
                    incident.title,
                );
                expect(stored?.description).toBe(
                    incident.description,
                );
                expect(stored?.priority).toBe(
                    incident.priority,
                );
                expect(stored?.status).toBe(
                    incident.status,
                );
                expect(stored?.reporter_id).toBe(
                    incident.reporterId,
                );
                expect(
                    stored?.created_at.toISOString(),
                ).toBe(incident.createdAt);
            },
        );
    },
);