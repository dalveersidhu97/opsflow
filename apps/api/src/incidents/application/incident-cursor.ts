import { IncidentCursor } from "./incident.repository.js";
import { IncidentCursorError } from "./invalid-incident-cursor.error.js";

export function decodeIncidentCursor(
    value: string,
): IncidentCursor {
    try {
        const decoded: unknown = JSON.parse(
            Buffer.from(
                value,
                'base64url',
            ).toString('utf8'),
        );

        if (
            typeof decoded !== 'object' ||
            decoded === null ||
            !('createdAt' in decoded) ||
            !('id' in decoded) ||
            typeof decoded.createdAt !==
            'string' ||
            typeof decoded.id !== 'string' ||
            decoded.id.length === 0
        ) {
            throw new IncidentCursorError();
        }

        const date =
            new Date(decoded.createdAt);

        if (Number.isNaN(date.getTime())) {
            throw new IncidentCursorError();
        }

        return {
            createdAt: date.toISOString(),
            id: decoded.id,
        };
    } catch (error: unknown) {
        if (
            error instanceof
            IncidentCursorError
        ) {
            throw error;
        }

        throw new IncidentCursorError();
    }
}

export function encodeIncidentCursor(
    cursor: IncidentCursor,
): string {
    return Buffer
        .from(JSON.stringify(cursor))
        .toString('base64url');
}