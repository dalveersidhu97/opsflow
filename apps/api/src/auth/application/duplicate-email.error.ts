export class DuplicateEmailError extends Error {
    constructor(message?: string) {
        super(message ?? 'Email already exists');
        this.name = 'DuplicateEmailError';
    }
}