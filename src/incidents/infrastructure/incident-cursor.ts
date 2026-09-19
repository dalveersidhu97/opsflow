import { IncidentCursor } from "../application/incident.repository.js";
import { IncidentCursorError } from "../application/invalid-incident-cursor.error.js";

export function decodeIncidentCursor(value: string): IncidentCursor {
    try {
        if (!value) throw new IncidentCursorError('Invalid Cursor');
        const cursorObject = JSON.parse(
            Buffer.from(value, 'base64url').toString('utf8'),
        );
        const createdAt: keyof IncidentCursor = 'createdAt';
        const id: keyof IncidentCursor = 'id';
        if (!(createdAt in cursorObject) || !(id in cursorObject)) {
            throw new IncidentCursorError('Missing createdAt or id');
        }
        if (typeof cursorObject[createdAt] !== 'string' || typeof cursorObject[id] !== 'string') {
            throw new IncidentCursorError('createdAt and id must be string');
        }
        const date = new Date(cursorObject[createdAt]);
        if (!(date instanceof Date)) {
            throw new IncidentCursorError('createdAt must be date')
        }
        return { createdAt: date.toISOString(), id };
    } catch (e) {
        throw e;
    }
}

export function encodeIncidentCursor(
    cursor: IncidentCursor,
): string {
    return Buffer
        .from(JSON.stringify(cursor))
        .toString('base64url');
}