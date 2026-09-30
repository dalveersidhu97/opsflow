// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CLOCK, type Clock } from './ports/clock.js';
import {
    ID_GENERATOR,
    type IdGenerator,
} from './ports/id-generator.js';

@Module({
    providers: [
        {
            provide: CLOCK,
            useValue: {
                now: () => new Date(),
            } satisfies Clock,
        },
        {
            provide: ID_GENERATOR,
            useValue: {
                newId: () => randomUUID(),
            } satisfies IdGenerator,
        },
    ],
    exports: [CLOCK, ID_GENERATOR],
})
export class CommonModule { }