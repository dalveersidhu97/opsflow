import type {
    INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import {
    configureApp,
    createOpenApiDocument,
} from '../src/app.setup.js';
import { CreateIncidentService } from '../src/incidents/application/create-incident.service.js';
import {
    CLOCK,
    INCIDENT_ID_GENERATOR,
} from '../src/incidents/application/ports.js';
import { Incident, INCIDENT_PRIORITIES } from '../src/incidents/domain/incident.js';
import {
    INCIDENT_REPOSITORY,
    IncidentCursor,
    IncidentRepository,
} from '../src/incidents/application/incident.repository.js';
import { INCIDENT_DEFAULT_LIMIT, INCIDENT_MAX_LIMIT, INCIDENT_MIN_LIMIT } from '../src/incidents/constants/incident-pagination-contants.js';

interface OpenApiTestSchema {
    required?: string[];
    properties?: Record<
        string,
        {
            type?: string;
            enum?: unknown[];
            maxLength?: number;
        }
    >;
}

const testIncidents: Incident[] = [
    {
        id: 'incident-1',
        createdAt: '2026-09-19T04:39:31.864Z',
        description: 'Broken ring scanner.',
        priority: 'HIGH',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'incident-2',
        createdAt: '2026-09-18T04:39:31.864Z',
        description: 'Network error on site.',
        priority: 'CRITICAL',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'incident-3',
        createdAt: '2026-09-17T04:39:31.864Z',
        description: 'Main gate camera failed.',
        priority: 'MEDIUM',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'incident-4',
        createdAt: '2026-08-17T04:39:31.864Z',
        description: 'Shortage of safety wests.',
        priority: 'LOW',
        reporterId: 'reporter-1',
        status: 'OPEN',
        title: 'Damaged ring scanner'
    },
    {
        id: 'incident-5',
        createdAt: '2026-08-16T04:39:31.864Z',
        description: 'Main gate camera failed.',
        priority: 'MEDIUM',
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

describe('Incidents API', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleReference =
            await Test.createTestingModule({
                imports: [AppModule],
            })
                .overrideProvider(CLOCK)
                .useValue({
                    now: () =>
                        new Date(
                            '2026-09-14T16:00:00.000Z',
                        ),
                })
                .overrideProvider(
                    INCIDENT_ID_GENERATOR,
                )
                .useValue({
                    newId: () =>
                        'incident-e2e-001',
                })
                .overrideProvider(
                    INCIDENT_REPOSITORY,
                )
                .useValue({
                    save: async () => undefined,
                    findPage: async () => undefined
                })
                .compile();

        app =
            moduleReference.createNestApplication();

        configureApp(app);

        await app.init();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await app.close();
    });

    it(
        'creates and explicitly maps an incident',
        async () => {
            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title:
                        '  Scanner station unavailable  ',
                    description: '  Station 14  ',
                    priority: 'CRITICAL',
                })
                .expect(201);

            expect(response.body).toEqual({
                id: 'incident-e2e-001',
                title:
                    'Scanner station unavailable',
                description: 'Station 14',
                priority: 'CRITICAL',
                status: 'OPEN',
                reporterId: 'demo-user-001',
                createdAt:
                    '2026-09-14T16:00:00.000Z',
            });
        },
    );

    it(
        'represents an omitted description as null',
        async () => {
            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title: 'Scanner unavailable',
                    priority: 'HIGH',
                })
                .expect(201);

            expect(
                response.body.description,
            ).toBeNull();
        },
    );

    it.each([
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
    ])(
        'accepts supported priority %s',
        async (priority) => {
            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title: 'Valid incident title',
                    priority,
                })
                .expect(201);

            expect(response.body.priority).toBe(
                priority,
            );
        },
    );

    it.each([
        {
            name: 'four-character title',
            body: {
                title: 'abcd',
                priority: 'HIGH',
            },
            issue:
                'title must contain 5 to 120 characters',
        },
        {
            name: '121-character title',
            body: {
                title: 'a'.repeat(121),
                priority: 'HIGH',
            },
            issue:
                'title must contain 5 to 120 characters',
        },
        {
            name: 'oversized description',
            body: {
                title: 'Valid incident title',
                description: 'a'.repeat(2_001),
                priority: 'HIGH',
            },
            issue:
                'description cannot exceed 2000 characters',
        },
        {
            name: 'missing title',
            body: {
                priority: 'HIGH',
            },
            issue: 'title must be a string',
        },
        {
            name: 'numeric title',
            body: {
                title: 42,
                priority: 'HIGH',
            },
            issue: 'title must be a string',
        },
        {
            name: 'null description',
            body: {
                title: 'Valid incident title',
                description: null,
                priority: 'HIGH',
            },
            issue:
                'description must be a string',
        },
        {
            name: 'invalid priority',
            body: {
                title: 'Valid incident title',
                priority: 'EMERGENCY',
            },
            issue:
                'priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
        },
    ])(
        'rejects $name',
        async ({ body, issue }) => {
            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send(body)
                .expect(400);

            expect(response.body).toMatchObject({
                statusCode: 400,
                code:
                    'REQUEST_VALIDATION_FAILED',
                message:
                    'Request validation failed',
            });

            expect(response.body.issues).toEqual(
                expect.arrayContaining([issue]),
            );
        },
    );

    it(
        'accepts title boundary lengths',
        async () => {
            await request(app.getHttpServer())
                .post('/v1/incidents')
                .send({
                    title: 'a'.repeat(5),
                    priority: 'LOW',
                })
                .expect(201);

            await request(app.getHttpServer())
                .post('/v1/incidents')
                .send({
                    title: 'a'.repeat(120),
                    priority: 'HIGH',
                })
                .expect(201);
        },
    );

    it(
        'rejects server-controlled properties',
        async () => {
            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title: 'Sorting machine stopped',
                    priority: 'HIGH',
                    reporterId: 'administrator',
                    status: 'RESOLVED',
                    id: 'client-selected-id',
                    createdAt: '2020-01-01',
                    organizationId:
                        'another-organization',
                })
                .expect(400);

            expect(response.body.issues).toEqual(
                expect.arrayContaining([
                    'property reporterId should not exist',
                    'property status should not exist',
                    'property id should not exist',
                    'property createdAt should not exist',
                    'property organizationId should not exist',
                ]),
            );
        },
    );

    it(
        'does not expose rejected values',
        async () => {
            const privateValue =
                'PRIVATE_REJECTED_VALUE';

            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title: 42,
                    priority: 'HIGH',
                    protectedValue: privateValue,
                })
                .expect(400);

            expect(
                JSON.stringify(response.body),
            ).not.toContain(privateValue);
        },
    );

    it(
        'does not expose unexpected errors',
        async () => {
            const privateError =
                'PRIVATE_DATABASE_FAILURE';

            const service = app.get(
                CreateIncidentService,
            );

            vi.spyOn(
                service,
                'execute',
            ).mockRejectedValueOnce(() => {
                throw new Error(privateError);
            });

            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title: 'Scanner unavailable',
                    priority: 'HIGH',
                })
                .expect(500);

            expect(response.body.statusCode).toBe(
                500,
            );

            expect(
                JSON.stringify(response.body),
            ).not.toContain(privateError);
        },
    );

    it(
        'does not expose an unversioned incident route',
        async () => {
            await request(app.getHttpServer())
                .post('/incidents')
                .send({
                    title: 'Scanner unavailable',
                    priority: 'HIGH',
                })
                .expect(404);
        },
    );

    it(
        'publishes the intended OpenAPI contract',
        () => {
            const document =
                createOpenApiDocument(app);

            const operation =
                document.paths[
                    '/v1/incidents'
                ]?.post;

            expect(operation).toBeDefined();
            expect(
                operation?.responses['201'],
            ).toBeDefined();
            expect(
                operation?.responses['400'],
            ).toBeDefined();

            const requestSchema =
                document.components?.schemas
                    ?.CreateIncidentRequestDto as
                | OpenApiTestSchema
                | undefined;

            expect(requestSchema).toBeDefined();

            expect(
                requestSchema?.required,
            ).toEqual(
                expect.arrayContaining([
                    'title',
                    'priority',
                ]),
            );

            expect(
                requestSchema?.required ?? [],
            ).not.toContain('description');

            const prioritySchema =
                requestSchema?.properties
                    ?.priority;

            expect(prioritySchema?.type).toBe(
                'string',
            );

            expect(prioritySchema?.enum).toEqual(
                [...INCIDENT_PRIORITIES],
            );

            expect(
                requestSchema?.properties
                    ?.description?.maxLength,
            ).toBe(2_000);
        },
    );

    it(
        'rejects invalid cursor',
        async () => {
            const response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents').query({ limit: 1, cursor: 'sdfsdf34534errgf' })
                .expect(400);

            expect(response.body.issues).toContain('Invalid cursor');
            expect(response.body.code).toBe('REQUEST_VALIDATION_FAILED');
        }
    )

    it(
        'rejects invalid limit',
        async () => {
            let response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents').query({ limit: INCIDENT_MAX_LIMIT + 1, cursor: null })
                .expect(400);
            expect(response.body.issues).toContain(`Limit must not exceed ${INCIDENT_MAX_LIMIT}`);
            expect(response.body.code).toBe('REQUEST_VALIDATION_FAILED');

            response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents').query({ limit: INCIDENT_MIN_LIMIT - 1, cursor: null })
                .expect(400);
            expect(response.body.issues).toContain(`Limit must be at least ${INCIDENT_MIN_LIMIT}`);
            expect(response.body.code).toBe('REQUEST_VALIDATION_FAILED');

            response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents').query({ limit: 'xsd', cursor: null })
                .expect(400);
            expect(response.body.issues).toContain('Limit must be an integer');
            expect(response.body.code).toBe('REQUEST_VALIDATION_FAILED');
        }
    )

    it(
        'returns 200 OK with expected incidents and nextCursor',
        async () => {
            const repository = app.get<IncidentRepository>(
                INCIDENT_REPOSITORY,
            );
            vi.spyOn(repository, 'findPage').mockResolvedValue(testIncidents.slice(0, 3));
            const expectedCursor: IncidentCursor = { createdAt: testIncidents[1].createdAt, id: testIncidents[1].id };
            const expectedCursorBase64 = Buffer.from(JSON.stringify(expectedCursor)).toString('base64url');
            const response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents').query({ limit: 2 })
                .expect(200);
            expect(response.body.incidents.length).toBe(2);
            expect(response.body.incidents[0]).toEqual(expect.objectContaining({ id: testIncidents[0].id }));
            expect(response.body.incidents[1]).toEqual(expect.objectContaining({ id: testIncidents[1].id }));
            expect(response.body.nextCursor).toBe(expectedCursorBase64);
        }
    )

    it(
        'returns null nextCursor if its last page',
        async () => {
            const repository = app.get<IncidentRepository>(
                INCIDENT_REPOSITORY,
            );
            vi.spyOn(repository, 'findPage').mockResolvedValue(testIncidents.slice(0, 5));
            const response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents').query({ limit: 5 })
                .expect(200);
            expect(response.body.incidents.length).toBe(5);
            let i = 0;
            for (let incident of response.body.incidents) {
                expect(incident).toEqual(expect.objectContaining({ id: testIncidents[i].id }));
                i++;
            }
            expect(response.body.nextCursor).toBe(null);
        }
    )
    it(
        `default page size limit is ${INCIDENT_DEFAULT_LIMIT}`,
        async () => {
            const testIncidents: Incident[] = generateTestIncidents(INCIDENT_DEFAULT_LIMIT + 5);
            const repository = app.get<IncidentRepository>(
                INCIDENT_REPOSITORY,
            );
            vi.spyOn(repository, 'findPage').mockResolvedValue(testIncidents);
            const response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents')
                .expect(200);
            expect(response.body.incidents.length).toBe(INCIDENT_DEFAULT_LIMIT);
        }
    )
    it(
        'returns correct next page by using cursor',
        async () => {
            const testIncidents: Incident[] = generateTestIncidents(25);
            const repository = app.get<IncidentRepository>(
                INCIDENT_REPOSITORY,
            );
            const limit = 5;
            const lastPage = 1;
            vi.spyOn(repository, 'findPage').mockResolvedValue(testIncidents.slice(limit * lastPage, (lastPage + 1) * limit + 1));
            const cursor: IncidentCursor = { createdAt: testIncidents[lastPage * limit].createdAt, id: testIncidents[lastPage * limit].id };
            const nextCursor = Buffer.from(JSON.stringify(cursor)).toString('base64url');
            const expectedIncidents = testIncidents.slice(limit * lastPage, lastPage * limit + limit);
            const expectedCursor: IncidentCursor = { createdAt: testIncidents[(lastPage + 1) * limit - 1].createdAt, id: testIncidents[(lastPage + 1) * limit - 1].id };
            const expectedNextCursor = Buffer.from(JSON.stringify(expectedCursor)).toString('base64url');
            const response = await request(
                app.getHttpServer(),
            )
                .get('/v1/incidents').query({ limit, cursor: nextCursor })
                .expect(200);
            expect(response.body.incidents.length).toBe(limit);
            expect(response.body.incidents.map((incident: any) => incident.id)).toStrictEqual(expectedIncidents.map(i => i.id));
            expect(response.body.nextCursor).toBe(expectedNextCursor);
        }
    )
});