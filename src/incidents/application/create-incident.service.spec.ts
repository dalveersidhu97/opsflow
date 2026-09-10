import { Test } from "@nestjs/testing";
import { CreateIncidentService } from "./create-incident.service.js";
import { CLOCK, Clock, INCIDENT_ID_GENERATOR, IncidentIdGenerator } from "./ports.js";

describe('CreateIncidentService', () => {
    let service: CreateIncidentService;
    const fakeClock: Clock = {
        now: () => new Date('2026-09-02T16:00:00.000Z'),
    };

    const fakeIdGenerator: IncidentIdGenerator = {
        newId: () => 'incident-service-001',
    };

    beforeEach(async () => {
        const moduleReference = await Test.createTestingModule({
            providers: [
                CreateIncidentService,
                {
                    provide: CLOCK,
                    useValue: fakeClock,
                },
                {
                    provide: INCIDENT_ID_GENERATOR,
                    useValue: fakeIdGenerator,
                },
            ],
        }).compile();

        service = moduleReference.get(CreateIncidentService);
    });


    it('creates an incident using injected dependencies', () => {
        const result = service.execute(
            {
                title: 'Loading dock door is blocked',
                priority: 'HIGH',
            },
            'user-42',
        );

        expect(result).toEqual({
            id: 'incident-service-001',
            title: 'Loading dock door is blocked',
            description: null,
            priority: 'HIGH',
            status: 'OPEN',
            reporterId: 'user-42',
            createdAt: '2026-09-02T16:00:00.000Z',
        });
    });
});