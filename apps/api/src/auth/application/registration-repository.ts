export interface CreateRegistrationInput {
    readonly userId: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly organizationId: string;
    readonly organizationName: string;
    readonly role: 'OWNER';
}

export interface RegistrationResult {
    readonly user: {
        readonly id: string;
        readonly email: string;
    };
    readonly organization: {
        readonly id: string;
        readonly name: string;
    };
    readonly role: 'OWNER';
}

export interface RegistrationRepository {
    createRegistration(
        input: CreateRegistrationInput,
    ): Promise<RegistrationResult>;
}