import { Incident } from "../domain/incident.js";
import { encodeIncidentCursor } from "../infrastructure/incident-cursor.js";
import { IncidentRepository } from "./incident.repository.js";
import { ListIncidentsService } from "./list-incidents.service.js";

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
]

describe('ListIncidentService', () => {
    it('returns right cursor and element', async () => {
        const repository: IncidentRepository = {
            save: async () => { },
            findPage: vi.fn(async () => testIncidents.slice(0, 2))
        }
        const service = new ListIncidentsService(repository);
        const result = await service.list({ cursor: null, limit: 1 });
        const nextExpectedCursor = encodeIncidentCursor({ createdAt: testIncidents[1].createdAt, id: testIncidents[1].id });
        expect(result.nextCursor).toBe(nextExpectedCursor);
        expect(result.incidents).toEqual([testIncidents[0]])
    });
});