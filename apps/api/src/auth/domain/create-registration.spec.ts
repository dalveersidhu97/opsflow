import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { InputValidationError } from "../../common/domain/input-validation.error.js";
import { ORGANIZATION_NAME_MAX_LENGTH, ORGANIZATION_NAME_MIN_LENGTH, REGISTER_EMAIL_MAX_LENGTH, REGISTER_PASSWORD_MAX_LENGTH, REGISTER_PASSWORD_MIN_LENGTH } from "./auth.js";
import { createRegistration, RegistrationCreationDependencies } from "./create-registration.js";
import argon2 from "argon2";

const dependencies: RegistrationCreationDependencies = {
    newId: () => '825ba4ec-11f8-4f40-800b-164c5a455589',
    hash: (text: string) => argon2.hash(text, { type: argon2.argon2id })
};

function genStr(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, num => chars[num % chars.length]).join('');
}

describe('createRegistration', () => {
    it('throws input validation error for invalid input type', async () => {
        const mockHash = vi.fn((text: string) => dependencies.hash(text));
        await expect(createRegistration(undefined, { ...dependencies, hash: mockHash }))
            .rejects
            .throws(InputValidationError, 'request body must be an object');
        await expect(createRegistration(null, { ...dependencies, hash: mockHash }))
            .rejects
            .throws(InputValidationError, 'request body must be an object');
        await expect(createRegistration([], { ...dependencies, hash: mockHash }))
            .rejects
            .throws(InputValidationError, 'request body must be an object');
        expect(mockHash).toHaveBeenCalledTimes(0);

    });

    it.each(['email must be a string', 'password must be a string', 'organizationName must be a string'])
        ('throws input validation error for missing email, organization or password', async (errorText) => {
            const mockHash = vi.fn((text: string) => dependencies.hash(text));
            await expect(createRegistration({}, { ...dependencies, hash: mockHash }))
                .rejects
                .throws(InputValidationError, errorText);
            expect(mockHash).toHaveBeenCalledTimes(0);
        });

    it('does not call hash function when input is invalid', async () => {
        const mockHash = vi.fn((text: string) => dependencies.hash(text));
        await expect(
            createRegistration(
                { email: 'invalidEmail.com', password: 'ValidPass@323', organizationName: 'Valid Organization' },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError);
        await expect(
            createRegistration(
                { email: 'valid@email.com', password: 'invalid', organizationName: 'Valid Organization' },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError);
        await expect(
            createRegistration(
                { email: 'valid@email.com', password: 'ValidPass@323', organizationName: '' },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError);
        expect(mockHash).toHaveBeenCalledTimes(0);
    });

    it('does not accept invalid lengths of email, password, organizationName', async () => {
        const mockHash = vi.fn((text: string) => dependencies.hash(text));
        await expect(
            createRegistration(
                { email: 'valid@email.com' + genStr(REGISTER_EMAIL_MAX_LENGTH), password: 'ValidPass@323', organizationName: 'Valid Organization' },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError, `email cannot exceed ${REGISTER_EMAIL_MAX_LENGTH} characters`);
        await expect(
            createRegistration(
                { email: 'valid@email.com', password: 'ValidPass@323' + genStr(REGISTER_PASSWORD_MAX_LENGTH), organizationName: 'Valid Organization' },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError, `password cannot exceed ${REGISTER_PASSWORD_MAX_LENGTH} characters`);
        await expect(
            createRegistration(
                { email: 'valid@email.com', password: 'VP@3', organizationName: 'Valid Organization' },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError, `password must be atleast ${REGISTER_PASSWORD_MIN_LENGTH} characters`);
        await expect(
            createRegistration(
                { email: 'valid@email.com', password: 'ValidPass@323', organizationName: 'Valid Organization' + genStr(ORGANIZATION_NAME_MAX_LENGTH) },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError, `organizationName cannot exceed ${ORGANIZATION_NAME_MAX_LENGTH} characters`);
        await expect(
            createRegistration(
                { email: 'valid@email.com', password: 'ValidPass@323', organizationName: '       V         ' },
                { ...dependencies, hash: mockHash }
            )
        ).rejects.throws(InputValidationError, `organizationName must be atleast ${ORGANIZATION_NAME_MIN_LENGTH} characters`);
        expect(mockHash).toHaveBeenCalledTimes(0);
    });

    it('creates registration with hashed password for right input', async () => {
        const mockHash = vi.fn((text: string) => dependencies.hash(text));
        const input = {
            email: 'valid@email.com',
            password: 'ValidPass@323',
            organizationName: 'Valid Organization'
        };
        const result = await createRegistration(input, { ...dependencies, hash: mockHash });
        expect(result.organization.id).toBeDefined();
        expect(result.user.id).toBeDefined();
        expect(result.role).toBe('OWNER');
        expect(
            await argon2.verify(result.user.passwordHash, input.password),
        ).toBe(true);
        expect(mockHash).toHaveBeenCalledTimes(1);
    });
});