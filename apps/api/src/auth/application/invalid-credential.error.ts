export class InvalidCredentialError extends Error {
    constructor(message?: string) {
        super(message ?? 'Invalid credentials');
        this.name = 'InvalidCredentialError';
    }
}