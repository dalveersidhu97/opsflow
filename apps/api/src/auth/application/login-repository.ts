export interface LoginUser {
    id: string;
    email: string;
    passwordHash: string;
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
}