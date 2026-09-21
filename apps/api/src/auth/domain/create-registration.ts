import { isEmail } from "class-validator";
import { InputValidationError } from "../../common/domain/input-validation.error.js";
import { ORGANIZATION_NAME_MAX_LENGTH, ORGANIZATION_NAME_MIN_LENGTH, REGISTER_EMAIL_MAX_LENGTH, REGISTER_PASSWORD_MAX_LENGTH, REGISTER_PASSWORD_MIN_LENGTH } from "./auth.js";

export interface RegistrationCreationDependencies {
    readonly newId: () => string;
    readonly hash: (text: string) => Promise<string>;
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

export async function createRegistration(raw: unknown, dependencies: RegistrationCreationDependencies) {
    if (!isRecord(raw)) {
        throw new InputValidationError([
            'request body must be an object',
        ]);
    }

    const issues: string[] = [];

    let email: string | undefined;

    if (typeof raw.email !== 'string') {
        issues.push('email must be a string');
    } else {
        const normalizedEmail = raw.email.trim().toLowerCase();
        if (normalizedEmail.length > REGISTER_EMAIL_MAX_LENGTH) {
            issues.push(`email cannot exceed ${REGISTER_EMAIL_MAX_LENGTH} characters`,);
        } else if (!isEmail(normalizedEmail)) {
            issues.push(`email must be a valid email`);
        } else {
            email = normalizedEmail;
        }
    }

    let password: string | undefined;

    if (typeof raw.password !== 'string') {
        issues.push('password must be a string');
    } else {
        if (raw.password.length > REGISTER_PASSWORD_MAX_LENGTH) {
            issues.push(`password cannot exceed ${REGISTER_PASSWORD_MAX_LENGTH} characters`,);
        } else if (raw.password.length < REGISTER_PASSWORD_MIN_LENGTH) {
            issues.push(`password must be atleast ${REGISTER_PASSWORD_MIN_LENGTH} characters`,);
        } else {
            password = raw.password;
        }
    }

    let organizationName: string | undefined;

    if (typeof raw.organizationName !== 'string') {
        issues.push('organizationName must be a string');
    } else {
        const normalizedOrganization = raw.organizationName.trim();
        if (normalizedOrganization.length > ORGANIZATION_NAME_MAX_LENGTH) {
            issues.push(`organizationName cannot exceed ${ORGANIZATION_NAME_MAX_LENGTH} characters`,);
        } else if (normalizedOrganization.length < ORGANIZATION_NAME_MIN_LENGTH) {
            issues.push(`organizationName must be atleast ${ORGANIZATION_NAME_MIN_LENGTH} characters`,);
        } else {
            organizationName = normalizedOrganization;
        }
    }

    if (issues.length > 0 || organizationName === undefined || password === undefined || email === undefined) {
        throw new InputValidationError(issues);
    }

    return {
        user: {
            id: dependencies.newId(),
            email,
            passwordHash: await dependencies.hash(password)
        },
        organization: {
            id: dependencies.newId(),
            name: organizationName
        },
        role: 'OWNER' as const
    }
}