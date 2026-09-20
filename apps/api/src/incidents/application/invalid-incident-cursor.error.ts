export class IncidentCursorError extends Error {
    constructor(message?: string) {
        super(message ?? 'Invalid cursor');
        this.name = 'IncidentCursorError';
    }
}