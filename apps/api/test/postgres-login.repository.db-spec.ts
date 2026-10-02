import { LoginRepository } from "../src/auth/application/login-repository.js";
import { SESSION_TTL_MS } from "../src/auth/domain/auth.js";
import { PostgresLoginRepository } from "../src/auth/infrastructure/postgres-login.repository.js";
import { PostgresDatabase } from "../src/database/postgres-database.js";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && new URL(databaseUrl).pathname !== '/opsflow_test') {
    throw new Error('Database integration tests must use opsflow_test');
}

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDatabase('PostgresLoginRepository', () => {

    const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174020',
        email: 'valid@email.com',
        password_hash: 'PASSWORD_HASH'
    }
    const nonExistingUser = {
        id: '123e4567-e89b-12d3-a456-426614174021',
        email: 'notexisting@email.com'
    };
    const testId = '123e4567-e89b-12d3-a456-426614174023';
    const testDate = new Date('2026-09-30T12:00:00.000Z');

    let database: PostgresDatabase;
    let loginRepository: LoginRepository;

    beforeAll(() => {
        database = new PostgresDatabase();
        loginRepository = new PostgresLoginRepository(database);
    });

    beforeEach(async () => {
        await database.query('DELETE FROM sessions');
        await database.query('DELETE FROM organization_memberships');
        await database.query('DELETE FROM organizations');
        await database.query('DELETE FROM users');
        await database.query(`INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)`, [existingUser.id, existingUser.email, existingUser.password_hash]);
    });

    afterAll(async () => {
        await database.query('DELETE FROM sessions');
        await database.query('DELETE FROM organization_memberships');
        await database.query('DELETE FROM organizations');
        await database.query('DELETE FROM users');
        await database.onModuleDestroy();
    });

    it('persists a session for an existing user', async () => {
        await loginRepository.createSession({
            userId: existingUser.id,
            id: testId,
            tokenDigest: 'TOKEN_DIGEST',
            createdAt: testDate.toISOString(),
            expiresAt: new Date(testDate.getTime() + SESSION_TTL_MS).toISOString()
        });

        const selectQuery = await database.query('SELECT * from sessions WHERE id = $1', [testId]);
        const createdSession = selectQuery.rows.length > 0 ? selectQuery.rows[0] : undefined;
        expect(createdSession).toEqual(expect.objectContaining({
            id: testId,
            user_id: existingUser.id,
            token_digest: 'TOKEN_DIGEST',
            revoked_at: null
        }));

        const created_at = new Date(testDate.getTime()).toISOString();
        const expires_at = new Date(testDate.getTime() + SESSION_TTL_MS).toISOString();
        expect(createdSession?.created_at?.toISOString()).toBe(created_at);
        expect(createdSession?.expires_at?.toISOString()).toBe(expires_at);
    });

    it('does not persist a session for non existing user', async () => {
        const promise = loginRepository.createSession({
            userId: nonExistingUser.id,
            id: testId,
            tokenDigest: 'TOKEN_DIGEST',
            createdAt: testDate.toISOString(),
            expiresAt: new Date(testDate.getTime() + SESSION_TTL_MS).toISOString()
        });

        await expect(promise).rejects.toMatchObject({
            code: '23503',
            constraint: 'sessions_user_id_fk'
        });
    });

    it('finds right user by email', async () => {
        const user = await loginRepository.findUserByEmail(existingUser.email);
        expect(user?.email).toBe(existingUser.email);
        expect(user?.id).toBe(existingUser.id);
        expect(user?.passwordHash).toBe(existingUser.password_hash);
    });

    it('findUserByEmail gives null for non existing user', async () => {
        const user = await loginRepository.findUserByEmail(nonExistingUser.email);
        expect(user).toBe(null);
    });

    it('findUserBySession returns right user for valid session', async () => {
        const existingSession = {
            userId: existingUser.id,
            id: testId,
            tokenDigest: 'TOKEN_DIGEST',
            createdAt: testDate.toISOString(),
            expiresAt: new Date(testDate.getTime() + SESSION_TTL_MS).toISOString(),
            revokedAt: null
        }

        await database.query(
            `
            INSERT INTO sessions (id, user_id, token_digest, created_at, expires_at) VALUES ($1, $2, $3, $4, $5);
            `,
            [existingSession.id, existingSession.userId, existingSession.tokenDigest, existingSession.createdAt, existingSession.expiresAt]
        );

        const result = await loginRepository.findUserBySession(existingSession.tokenDigest);

        expect(result).not.toBe(null);
        expect(result?.email).toBe(existingUser.email);
        expect(result?.createdAt.toISOString()).toBe(existingSession.createdAt);
        expect(result?.expiresAt.toISOString()).toBe(existingSession.expiresAt);
        expect(result?.userId).toBe(existingSession.userId);
        expect(result?.revokedAt).toBe(null);
    });

    it('findUserBySession returns null for invalid session', async () => {
        const result = await loginRepository.findUserBySession('unknown session digest.');
        expect(result).toBe(null);
    });
});