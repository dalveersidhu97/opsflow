import type { INestApplication } from '@nestjs/common';
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
                            '2026-09-02T17:30:00.000Z',
                        ),
                })
                .overrideProvider(
                    INCIDENT_ID_GENERATOR,
                )
                .useValue({
                    newId: () => 'incident-e2e-001',
                })
                .compile();

        app =
            moduleReference.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('creates an incident through HTTP', async () => {
        const response = await request(
            app.getHttpServer(),
        )
            .post('/incidents')
            .send({
                title: '  Scanner station unavailable  ',
                description: '  Station 14  ',
                priority: 'CRITICAL',

                // Attempts to overwrite protected fields:
                reporterId: 'administrator',
                status: 'RESOLVED',
            })
            .expect(201);

        expect(response.body).toEqual({
            id: 'incident-e2e-001',
            title: 'Scanner station unavailable',
            description: 'Station 14',
            priority: 'CRITICAL',
            status: 'OPEN',
            reporterId: 'demo-user-001',
            createdAt: '2026-09-02T17:30:00.000Z',
        });
    });

    it('returns a controlled 400 response', async () => {
        const response = await request(
            app.getHttpServer(),
        )
            .post('/incidents')
            .send({
                title: 'x',
                priority: 'EMERGENCY',
            })
            .expect(400);

        expect(response.body.code).toBe(
            'INCIDENT_INPUT_INVALID',
        );

        expect(response.body.message).toBe(
            'Incident input is invalid',
        );

        expect(response.body.issues).toEqual(
            expect.arrayContaining([
                'title must contain 5 to 120 characters',
                expect.stringContaining(
                    'priority must be one of',
                ),
            ]),
        );
    });
});