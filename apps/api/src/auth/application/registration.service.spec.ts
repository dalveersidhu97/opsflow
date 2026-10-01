import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { CreateRegistrationInput, RegistrationRepository, RegistrationResult } from './registration-repository.js';
import { RegisterationService } from './registeration.service.js';
import { PasswordHasher } from './password-hasher.js';
import { InputValidationError } from '../../common/domain/input-validation.error.js';
import { DuplicateEmailError } from './duplicate-email.error.js';
import { IdGenerator } from '../../common/ports/id-generator.js';


describe('registrationService', () => {
    it('creates and persists a registration', async () => {
        const rawInput = {
            email: ' Valid@email.com ',
            organizationName: 'Wahl Distrubutions ',
            password: ' Valid@Pass234 '
        };
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const organizationId = '223e4567-e89b-42d3-a456-426614174000';
        const hashedPassowrd = 'TEST_PASSWORD_HASH';
        const idGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(userId).mockReturnValueOnce(organizationId)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValue(hashedPassowrd),
            verify: vi.fn().mockRejectedValue('Not implemented')
        };
        const createRegistration = vi.fn(async (input: CreateRegistrationInput): Promise<RegistrationResult> => ({
            organization: {
                name: input.organizationName,
                id: input.organizationId
            },
            user: {
                id: input.userId,
                email: input.email
            },
            role: 'OWNER'
        }));
        const repository: RegistrationRepository = {
            createRegistration
        };
        const service = new RegisterationService(repository, idGenerator, passwordHasher);
        const result = await service.execute(rawInput);

        expect(createRegistration).toHaveBeenCalledWith({
            email: 'valid@email.com',
            organizationName: 'Wahl Distrubutions',
            passwordHash: 'TEST_PASSWORD_HASH',
            organizationId: organizationId,
            role: 'OWNER',
            userId: userId
        });
        expect(idGenerator.newId).toHaveBeenCalledTimes(2);
        expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
        expect(createRegistration).toHaveBeenCalledTimes(1);
        expect(passwordHasher.hash).toHaveBeenCalledWith(rawInput.password);
        expect(result).toEqual({
            user: {
                email: rawInput.email.trim().toLowerCase(),
                id: userId
            },
            organization: {
                id: organizationId,
                name: rawInput.organizationName.trim()
            },
            role: 'OWNER'
        })
    });

    it.each([
        {
            email: ' Validemail.com ',
            organizationName: 'Wahl Distrubutions ',
            password: 'Valid@Pass234 '
        },
        {
            email: ' Valid@email.com ',
            organizationName: 'W',
            password: ' Valid@Pass234 '
        },
        {
            email: '  Valid@email.com ',
            organizationName: 'Wahl Distrubutions ',
            password: 'Valid@Pss '
        }
    ])('does not call repository and dependencies if input is invalid', async (rawInput) => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const organizationId = '223e4567-e89b-42d3-a456-426614174000';
        const idGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(userId).mockReturnValueOnce(organizationId)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValue('TEST_PASSWORD_HASH'),
            verify: vi.fn().mockRejectedValue('Not implemented')
        };
        const createRegistration = vi.fn(async (input: CreateRegistrationInput): Promise<RegistrationResult> => ({
            organization: {
                name: input.organizationName,
                id: input.organizationId
            },
            user: {
                id: input.userId,
                email: input.email
            },
            role: 'OWNER'
        }));
        const repository: RegistrationRepository = {
            createRegistration
        };
        const service = new RegisterationService(repository, idGenerator, passwordHasher);
        await expect(service.execute(rawInput)).rejects.throws(InputValidationError);

        expect(createRegistration).toHaveBeenCalledTimes(0);
        expect(idGenerator.newId).toHaveBeenCalledTimes(0);
        expect(passwordHasher.hash).toHaveBeenCalledTimes(0);
    });

    it('hash rejection prevents persistence', async () => {
        const rawInput = {
            email: ' Valid@email.com ',
            organizationName: 'Wahl Distrubutions ',
            password: ' Valid@Pass234 '
        };
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const organizationId = '223e4567-e89b-42d3-a456-426614174000';
        const idGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(userId).mockReturnValueOnce(organizationId)
        };
        const hashFailure = new Error('hashing error');
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockRejectedValue(hashFailure),
            verify: vi.fn().mockRejectedValue('Not implemented')
        };
        const createRegistration = vi.fn(async (input: CreateRegistrationInput): Promise<RegistrationResult> => ({
            organization: {
                name: input.organizationName,
                id: input.organizationId
            },
            user: {
                id: input.userId,
                email: input.email
            },
            role: 'OWNER'
        }));
        const repository: RegistrationRepository = {
            createRegistration
        };
        const service = new RegisterationService(repository, idGenerator, passwordHasher);
        await expect(service.execute(rawInput)).rejects.toBe(hashFailure);
        expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
        expect(createRegistration).toHaveBeenCalledTimes(0);
        expect(passwordHasher.hash).toHaveBeenCalledWith(rawInput.password);
    });

    it('propagates repository failure', async () => {
        const rawInput = {
            email: ' Valid@email.com ',
            organizationName: 'Wahl Distrubutions ',
            password: ' Valid@Pass234 '
        };
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const organizationId = '223e4567-e89b-42d3-a456-426614174000';
        const idGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(userId).mockReturnValueOnce(organizationId)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValue('TEST_PASSWORD_HASH'),
            verify: vi.fn().mockRejectedValue('Not implemented')
        };
        const duplicateEmailError = new DuplicateEmailError();
        const createRegistration = vi.fn().mockRejectedValue(duplicateEmailError);
        const repository: RegistrationRepository = {
            createRegistration
        };
        const service = new RegisterationService(repository, idGenerator, passwordHasher);
        await expect(service.execute(rawInput)).rejects.toBe(duplicateEmailError);
        expect(createRegistration).toHaveBeenCalledTimes(1);
        expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
        expect(passwordHasher.hash).toHaveBeenCalledWith(rawInput.password);
    });

    it('waits for persistence before returning', async () => {
        let resolveRepository = () => { };
        let serviceResolved: boolean = false;
        let result: RegistrationResult | undefined = undefined;
        const rawInput = {
            email: ' Valid@email.com ',
            organizationName: 'Wahl Distrubutions ',
            password: ' Valid@Pass234 '
        };
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const organizationId = '223e4567-e89b-42d3-a456-426614174000';
        const hashedPassowrd = 'TEST_PASSWORD_HASH';
        const idGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(userId).mockReturnValueOnce(organizationId)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValue(hashedPassowrd),
            verify: vi.fn().mockRejectedValue('Not implemented')
        };
        const createRegistration = vi.fn((input: CreateRegistrationInput): Promise<RegistrationResult> => {
            return new Promise((resolve) => {
                resolveRepository = () => {
                    resolve({
                        organization: {
                            name: input.organizationName,
                            id: input.organizationId
                        },
                        user: {
                            id: input.userId,
                            email: input.email
                        },
                        role: 'OWNER'
                    });
                }
            });
        });
        const repository: RegistrationRepository = {
            createRegistration
        };
        const service = new RegisterationService(repository, idGenerator, passwordHasher);
        const promise = service.execute(rawInput).then((res) => {
            result = res;
            serviceResolved = true;
        });

        await vi.waitFor(() => { expect(createRegistration).toHaveBeenCalledOnce() })

        expect(idGenerator.newId).toHaveBeenCalledTimes(2);
        expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
        expect(passwordHasher.hash).toHaveBeenCalledWith(rawInput.password);

        expect(createRegistration).toHaveBeenCalledTimes(1);
        expect(createRegistration).toHaveBeenCalledWith({
            email: 'valid@email.com',
            organizationName: 'Wahl Distrubutions',
            passwordHash: 'TEST_PASSWORD_HASH',
            organizationId: organizationId,
            role: 'OWNER',
            userId: userId
        });

        await new Promise<void>((resolve) => setImmediate(resolve));

        expect(result).toBe(undefined);
        expect(serviceResolved).toBe(false);

        resolveRepository();
        await promise;

        expect(serviceResolved).toBe(true);

        expect(result).toEqual({
            user: {
                email: rawInput.email.trim().toLowerCase(),
                id: userId
            },
            organization: {
                id: organizationId,
                name: rawInput.organizationName.trim()
            },
            role: 'OWNER'
        })
    });
});