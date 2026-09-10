import {
    INCIDENT_PRIORITIES,
    type CreateIncidentInput,
    type Incident,
    type IncidentPriority,
} from './incident.js';
import { InputValidationError } from './input-validation.error.js';

export interface IncidentCreationDependencies {
    readonly newId: () => string;
    readonly now: () => Date;
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isIncidentPriority(
    value: unknown,
): value is IncidentPriority {
    return (
        typeof value === 'string' &&
        INCIDENT_PRIORITIES.some(
            (priority) => priority === value,
        )
    );
}

export function parseCreateIncidentInput(
    raw: unknown,
): CreateIncidentInput {
    if (!isRecord(raw)) {
        throw new InputValidationError([
            'request body must be an object',
        ]);
    }

    const issues: string[] = [];

    let title: string | undefined;

    if (typeof raw.title !== 'string') {
        issues.push('title must be a string');
    } else {
        const normalizedTitle = raw.title.trim();

        if (
            normalizedTitle.length < 5 ||
            normalizedTitle.length > 120
        ) {
            issues.push(
                'title must contain 5 to 120 characters',
            );
        } else {
            title = normalizedTitle;
        }
    }

    let description: string | null = null;

    if (
        raw.description !== undefined &&
        raw.description !== null
    ) {
        if (typeof raw.description !== 'string') {
            issues.push(
                'description must be a string or null',
            );
        } else {
            const normalizedDescription =
                raw.description.trim();

            if (normalizedDescription.length > 2_000) {
                issues.push(
                    'description cannot exceed 2000 characters',
                );
            } else {
                description = normalizedDescription || null;
            }
        }
    }

    let priority: IncidentPriority | undefined;

    if (isIncidentPriority(raw.priority)) {
        priority = raw.priority;
    } else {
        issues.push(
            `priority must be one of: ${INCIDENT_PRIORITIES.join(', ')}`,
        );
    }

    if (
        issues.length > 0 ||
        title === undefined ||
        priority === undefined
    ) {
        throw new InputValidationError(issues);
    }

    return {
        title,
        description,
        priority,
    };
}

export function createIncident(
    raw: unknown,
    authenticatedReporterId: string,
    dependencies: IncidentCreationDependencies,
): Incident {
    const reporterId = authenticatedReporterId.trim();

    if (!reporterId) {
        throw new Error(
            'Authenticated reporter ID is required',
        );
    }

    const input = parseCreateIncidentInput(raw);
    const id = dependencies.newId();
    const createdAt = dependencies.now();

    if (!id.trim()) {
        throw new Error(
            'ID generator returned an empty ID',
        );
    }

    if (Number.isNaN(createdAt.getTime())) {
        throw new Error(
            'Clock returned an invalid date',
        );
    }

    return {
        id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: 'OPEN',
        reporterId,
        createdAt: createdAt.toISOString(),
    };
}