
export const USER_ROLES = [
    'OWNER',
    'MEMBER'
] as const;

export type UserRole = typeof USER_ROLES[number];

export const ORGANIZATION_NAME_MAX_LENGTH = 120;
export const ORGANIZATION_NAME_MIN_LENGTH = 2;
export const REGISTER_PASSWORD_MAX_LENGTH = 128;
export const REGISTER_PASSWORD_MIN_LENGTH = 12;
export const REGISTER_EMAIL_MAX_LENGTH = 120;