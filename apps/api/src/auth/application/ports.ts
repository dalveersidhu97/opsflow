
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const REGISTRATION_ID_GENERATOR = Symbol('REGISTRATION_ID_GENERATOR');

export interface RegistrationIdGenerator {
    newId(): string;
}

export const REGISTRATION_REPOSITORY = Symbol('REGISTRATION_REPOSITORY');