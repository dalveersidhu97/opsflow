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
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import {
    CLOCK,
    INCIDENT_ID_GENERATOR,
} from '../src/incidents/application/ports.js';

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
                            '2026-09-07T16:00:00.000Z',
                        ),
                })
                .overrideProvider(
                    INCIDENT_ID_GENERATOR,
                )
                .useValue({
                    newId: () =>
                        'incident-e2e-001',
                })
                .compile();

        app =
            moduleReference.createNestApplication();

        configureApp(app);

        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it(
        'creates an incident through version one',
        async () => {
            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title:
                        'Scanner station unavailable',
                    description: 'Station 14',
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
                    '2026-09-07T16:00:00.000Z',
            });
        },
    );

    it(
        'returns structured validation errors',
        async () => {
            const response = await request(
                app.getHttpServer(),
            )
                .post('/v1/incidents')
                .send({
                    title: 'x',
                    priority: 'EMERGENCY',
                })
                .expect(400);

            expect(response.body).toEqual({
                statusCode: 400,
                code:
                    'REQUEST_VALIDATION_FAILED',
                message:
                    'Request validation failed',
                issues: expect.arrayContaining([
                    'title must contain 5 to 120 characters',
                    'priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
                ]),
            });
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
                    title:
                        'Sorting machine stopped',
                    priority: 'HIGH',
                    reporterId: 'administrator',
                    status: 'RESOLVED',
                })
                .expect(400);

            expect(response.body.code).toBe(
                'REQUEST_VALIDATION_FAILED',
            );

            expect(response.body.issues).toEqual(
                expect.arrayContaining([
                    'property reporterId should not exist',
                    'property status should not exist',
                ]),
            );
        },
    );

    it(
        'does not expose the API without a version',
        async () => {
            await request(
                app.getHttpServer(),
            )
                .post('/incidents')
                .send({
                    title:
                        'Scanner station unavailable',
                    priority: 'HIGH',
                })
                .expect(404);
        },
    );
});