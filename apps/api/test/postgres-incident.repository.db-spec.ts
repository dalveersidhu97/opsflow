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


const testIncidents: Incident[] = [
    {
        id: 'e2576e72-a55f-4317-a7bb-f08f617c7dce',
        createdAt: '2026-09-17T04:39:31.864Z',
        description: 'Main gate camera failed.',
        priority: 'MEDIUM',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'e2576e72-a55f-4317-a7bb-f08f61c7cdce',
        createdAt: '2026-09-19T04:39:31.864Z',
        description: 'Broken ring scanner.',
        priority: 'HIGH',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'e2576e72-a55f-4317-a7bc-f08f61c77dce',
        createdAt: '2026-09-18T04:39:31.864Z',
        description: 'Network error on site.',
        priority: 'CRITICAL',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'c2576e72-a55f-4317-a7bb-f08f61c77dce',
        createdAt: '2026-08-16T04:39:31.864Z',
        description: 'Main gate camera failed.',
        priority: 'MEDIUM',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'b2576e72-a55f-4317-a7bb-f08f61c77dce',
        createdAt: '2026-08-17T04:39:31.864Z',
        description: 'Shortage of safety wests.',
        priority: 'LOW',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    }
];

function generateTestIncidents(count: number): Incident[] {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
    const statuses = ['OPEN'] as const;

    const startTime = Date.UTC(2026, 8, 19, 12, 0, 0);

    return Array.from({ length: count }, (_, index): Incident => {
        // Every 3 incidents have the same createdAt.
        // This forces the DB to use id as a tie-breaker.
        const timestampGroup = Math.floor(index / 3);

        return {
            id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,

            createdAt: new Date(
                startTime - timestampGroup * 60_000,
            ).toISOString(),

            title: `Test incident ${index + 1}`,

            description: `Test incident description ${index + 1}`,

            priority: priorities[index % priorities.length],

            reporterId: `reporter-${(index % 5) + 1}`,

            status: statuses[index % statuses.length],
        };
    });
}

async function insertIncidents(incidents: Incident[], db: PostgresDatabase): Promise<void> {
    for (const incident of incidents) {
        await db.query(
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
        VALUES ($1, $2, $3, $4, $5, $6, $7)
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

        it(
            'returns inserted incidents',
            async () => {
                await insertIncidents(testIncidents, database);
                const insidents = await repository.findPage({ limit: 5, cursor: null });
                expect(insidents.length).toEqual(5);
                expect(insidents).toEqual(expect.arrayContaining(testIncidents));
            }
        );

        it(
            'empty table return []',
            async () => {
                const insidents = await repository.findPage({ limit: 5, cursor: null });
                expect(insidents.length).toEqual(0);
                expect(insidents).toEqual([]);
            }
        );

        it(
            'cursor and limit return appropriate page',
            async () => {
                const generatedIncidents = generateTestIncidents(13);
                const expectedInOrder = [...generatedIncidents].sort((a, b) => {
                    const dateDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    if (dateDifference !== 0) return dateDifference;
                    return b.id.localeCompare(a.id);
                });
                await insertIncidents(generatedIncidents, database);
                const limit = 5;
                // Page 1
                const insidents = await repository.findPage({ limit: limit, cursor: null });
                expect(insidents.length).toEqual(limit + 1);
                expect(insidents).toEqual(expectedInOrder.slice(0, limit + 1));
                // Page 2
                const page2Cursor = { createdAt: insidents[limit - 1].createdAt, id: insidents[limit - 1].id };
                const insidents2 = await repository.findPage({ limit: limit, cursor: page2Cursor });
                expect(insidents2.length).toEqual(limit + 1);
                expect(insidents2).toEqual(expectedInOrder.slice(1 * limit, limit * 2 + 1));
                // Page 3
                const page3Cursor = { createdAt: insidents2[limit - 1].createdAt, id: insidents2[limit - 1].id };
                const insidents3 = await repository.findPage({ limit: limit, cursor: page3Cursor });
                expect(insidents3.length).toEqual(expectedInOrder.length - limit * 2);
                expect(insidents3).toEqual(expectedInOrder.slice(2 * limit, expectedInOrder.length));
            }
        );
    },
);