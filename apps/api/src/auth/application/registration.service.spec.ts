import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { RegistrationRepository, RegistrationResult } from './registration-repository.js';
import { RegisterationService } from './registeration.service.js';
import { RegistrationIdGenerator } from './ports.js';
import { randomUUID } from 'crypto';
import { PasswordHasher } from './password-hasher.js';
import argon2 from 'argon2';

const testRegistration = (): RegistrationResult => {
    return {
        role: 'OWNER',
        organization: {
            id: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Some Organization'
        },
        user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'valid@email.com'
        }
    }
}

const testRegistrationInput = (): unknown => {
    return {
        email: 'valid@email.com',
        organizationName: 'Wahl Distrubutions',
        password: 'Valid@Pass234'
    }
}

describe('registrationService', () => {
    it('creates and persists a registration', async () => {
        const createRegistration = vi.fn(async (): Promise<RegistrationResult> => (testRegistration()));
        const repository: RegistrationRepository = {
            createRegistration
        };
        const idGenerator: RegistrationIdGenerator = { newId: vi.fn(() => randomUUID()) };
        const passwordHasher: PasswordHasher = { hash: vi.fn((text: string) => argon2.hash(text, { type: argon2.argon2id })) };

        const service = new RegisterationService(repository, idGenerator, passwordHasher);

        const result = await service.execute(testRegistrationInput());

        expect(result).toEqual(testRegistration());
        expect(createRegistration).toHaveBeenCalledOnce();
        expect(idGenerator.newId).toHaveBeenCalledTimes(2);
        expect(passwordHasher.hash).toHaveBeenCalledOnce();
    })
});