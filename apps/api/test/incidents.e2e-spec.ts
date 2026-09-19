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
import { INCIDENT_PRIORITIES } from '../src/incidents/domain/incident.js';
import {
    INCIDENT_REPOSITORY,
} from '../src/incidents/application/incident.repository.js';

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
});