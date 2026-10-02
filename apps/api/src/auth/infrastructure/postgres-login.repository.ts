import { Injectable } from "@nestjs/common";
import type { CreateSessionInput, LoginRepository, LoginUser, UserSession } from "../application/login-repository.js";
import { PostgresDatabase } from "../../database/postgres-database.js";

@Injectable()
export class PostgresLoginRepository implements LoginRepository {

    constructor(
        private readonly database: PostgresDatabase,
    ) { }
    async findUserBySession(tokenDigest: string): Promise<UserSession | null> {
        const result = await this.database.query<UserSession>(
            `
                SELECT
                    u.id AS "userId",
                    u.email,
                    s.created_at AS "createdAt",
                    s.expires_at AS "expiresAt",
                    s.revoked_at AS "revokedAt"
                FROM sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_digest = $1
            `,
            [tokenDigest],
        );

        const row = result.rows[0] ?? null;

        return row;
    }

    async findUserByEmail(email: string): Promise<LoginUser | null> {
        const result = await this.database.query<LoginUser>(
            `
                SELECT
                    id,
                    email,
                    password_hash AS "passwordHash"
                FROM users
                WHERE email = $1
            `,
            [email],
        );

        return result.rows[0] ?? null;
    }
    async createSession(input: CreateSessionInput): Promise<void> {
        await this.database.query(
            `
                INSERT INTO sessions (id, user_id, token_digest, created_at, expires_at) 
                VALUES ($1, $2, $3, $4, $5)
            `,
            [input.id, input.userId, input.tokenDigest, input.createdAt, input.expiresAt],
        );
    }
}