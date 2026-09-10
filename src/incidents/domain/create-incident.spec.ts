import { describe, expect, it } from 'vitest';
import {
    createIncident,
    type IncidentCreationDependencies,
} from './create-incident.js';
import { InputValidationError } from './input-validation.error.js';

const dependencies: IncidentCreationDependencies = {
    newId: () => 'incident-001',
    now: () =>
        new Date('2026-09-01T16:00:00.000Z'),
};

describe('createIncident', () => {
    it('creates a normalized incident', () => {
        const result = createIncident(
            {
                title: '  Conveyor belt stopped  ',
                description: '   ',
                priority: 'HIGH',

                // Untrusted fields must not override server values.
                reporterId: 'administrator',
                status: 'RESOLVED',
            },
            'user-42',
            dependencies,
        );

        expect(result).toEqual({
            id: 'incident-001',
            title: 'Conveyor belt stopped',
            description: null,
            priority: 'HIGH',
            status: 'OPEN',
            reporterId: 'user-42',
            createdAt: '2026-09-01T16:00:00.000Z',
        });
    });

    it('rejects a non-object body', () => {
        expect(() =>
            createIncident(
                null,
                'user-42',
                dependencies,
            ),
        ).toThrow(InputValidationError);
    });

    it('rejects invalid user-controlled fields', () => {
        const action = () =>
            createIncident(
                {
                    title: 'x',
                    description: 123,
                    priority: 'EMERGENCY',
                },
                'user-42',
                dependencies,
            );

        expect(action).toThrow(InputValidationError);
        expect(action).toThrow(
            /title must contain 5 to 120 characters/,
        );
        expect(action).toThrow(
            /description must be a string or null/,
        );
        expect(action).toThrow(
            /priority must be one of/,
        );
    });

    it('rejects a missing trusted reporter ID', () => {
        expect(() =>
            createIncident(
                {
                    title: 'Conveyor belt stopped',
                    priority: 'HIGH',
                },
                '   ',
                dependencies,
            ),
        ).toThrow(
            'Authenticated reporter ID is required',
        );
    });
});