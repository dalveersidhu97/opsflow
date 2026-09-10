export class InputValidationError extends Error {
    constructor(public readonly issues: readonly string[]) {
        super(issues.join('; '));
        this.name = 'InputValidationError';
    }
}