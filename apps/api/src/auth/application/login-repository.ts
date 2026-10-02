export interface LoginUser {
    id: string;
    email: string;
    passwordHash: string;
}

export interface UserSession {
    userId: string;
    email: string;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
}

export interface CreateSessionInput {
    id: string;
    userId: string;
    tokenDigest: string;
    createdAt: string;
    expiresAt: string;
}

export interface LoginRepository {
    findUserByEmail(email: string): Promise<LoginUser | null>;

    createSession(input: CreateSessionInput): Promise<void>;

    findUserBySession(tokenDigest: string): Promise<UserSession | null>
}