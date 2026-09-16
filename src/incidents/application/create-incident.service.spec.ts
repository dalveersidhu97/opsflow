import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import type { IncidentRepository } from './incident.repository.js';
import { CreateIncidentService } from './create-incident.service.js';
import type {
    Clock,
    IncidentIdGenerator,
} from './ports.js';

describe('CreateIncidentService', () => {
    it(
        'creates and persists an incident',
        async () => {
            const clock: Clock = {
                now: () =>
                    new Date(
                        '2026-09-15T16:00:00.000Z',
                    ),
            };

            const idGenerator:
                IncidentIdGenerator = {
                newId: () =>
                    'e2576e72-a55f-4317-a7bb-f08f61c77dce',
            };

            const save = vi.fn(
                async (): Promise<void> =>
                    undefined,
            );

            const repository:
                IncidentRepository = {
                save,
            };

            const service =
                new CreateIncidentService(
                    clock,
                    idGenerator,
                    repository,
                );

            const incident =
                await service.execute(
                    {
                        title: 'Scanner unavailable',
                        priority: 'HIGH',
                    },
                    'demo-user-001',
                );

            expect(incident).toEqual({
                id:
                    'e2576e72-a55f-4317-a7bb-f08f61c77dce',
                title: 'Scanner unavailable',
                description: null,
                priority: 'HIGH',
                status: 'OPEN',
                reporterId: 'demo-user-001',
                createdAt:
                    '2026-09-15T16:00:00.000Z',
            });

            expect(save).toHaveBeenCalledOnce();
            expect(save).toHaveBeenCalledWith(
                incident,
            );
        },
    );

    it(
        'does not resolve when persistence fails',
        async () => {
            const databaseError =
                new Error('database unavailable');

            const service =
                new CreateIncidentService(
                    {
                        now: () =>
                            new Date(
                                '2026-09-15T16:00:00.000Z',
                            ),
                    },
                    {
                        newId: () =>
                            'e2576e72-a55f-4317-a7bb-f08f61c77dce',
                    },
                    {
                        save: async () => {
                            throw databaseError;
                        },
                    },
                );

            await expect(
                service.execute(
                    {
                        title: 'Scanner unavailable',
                        priority: 'HIGH',
                    },
                    'demo-user-001',
                ),
            ).rejects.toBe(databaseError);
        },
    );
});