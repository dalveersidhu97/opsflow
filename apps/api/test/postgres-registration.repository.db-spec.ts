import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';
import { randomUUID } from "crypto";
import { PostgresRegistrationRepository } from "../src/auth/infrastructure/postgres-registration.repository.js";
import { PostgresDatabase } from "../src/database/postgres-database.js";
import { ArgonPasswordHasher } from '../src/auth/infrastructure/argon-password-hasher.js';
import { DuplicateEmailError } from '../src/auth/application/duplicate-email.error.js';

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && !databaseUrl.includes('/opsflow_test')) {
    throw new Error('Database integration tests must use opsflow_test');
}

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDatabase(
    'PostgresRegistrationRepository',
    () => {
        let database: PostgresDatabase;
        let repository: PostgresRegistrationRepository;

        beforeAll(() => {
            database = new PostgresDatabase();
            repository = new PostgresRegistrationRepository(database);
        });

        beforeEach(async () => {
            await database.query('DELETE FROM organization_memberships');
            await database.query('DELETE FROM organizations');
            await database.query('DELETE FROM users');
        });

        afterAll(async () => {
            await database.onModuleDestroy();
        });

        it(
            'atomically creates a user, organization, and owner membership',
            async () => {
                const plainPassword = 'correct horse battery staple';
                const passwordHash = await new ArgonPasswordHasher().hash(plainPassword);
                const result = await repository.createRegistration({
                    email: 'testemail@gmail.com',
                    organizationId: randomUUID(),
                    organizationName: 'Test Organization',
                    passwordHash: passwordHash,
                    role: 'OWNER',
                    userId: randomUUID()
                });
                const usersQuery = await database.query('SELECT id, email, password_hash FROM users');
                const organizationQuery = await database.query('SELECT id, organization_name FROM organizations');
                const organizationMembershipsQuery = await database.query('SELECT organization_id, user_id, user_role FROM organization_memberships');

                expect(usersQuery.rowCount).toBe(1);
                expect(organizationQuery.rowCount).toBe(1);
                expect(organizationMembershipsQuery.rowCount).toBe(1);

                expect(result.user).toEqual({ id: usersQuery.rows[0].id, email: usersQuery.rows[0].email });
                expect(result.organization).toEqual({ id: organizationQuery.rows[0].id, name: organizationQuery.rows[0].organization_name });
                expect(result.role).toBe(organizationMembershipsQuery.rows[0].user_role);
                expect(organizationMembershipsQuery.rows[0].user_id).toBe(result.user.id);
                expect(organizationMembershipsQuery.rows[0].organization_id).toBe(result.organization.id);
                expect(usersQuery.rows[0].password_hash).not.toBe(plainPassword);
                expect(usersQuery.rows[0].password_hash).toMatch(/^\$argon2id\$/);
            }
        )

        it(
            'wrong role ADMIN does not insert anything',
            async () => {
                const plainPassword = 'correct horse battery staple';
                const passwordHash = await new ArgonPasswordHasher().hash(plainPassword);
                await expect(repository.createRegistration({
                    email: 'testemail@gmail.com',
                    organizationId: randomUUID(),
                    organizationName: 'Test Organization',
                    passwordHash: passwordHash,
                    role: 'ADMIN' as unknown as 'OWNER',
                    userId: randomUUID()
                })).rejects.toThrow('organization_memberships_user_role_check');

                const usersQuery = await database.query('SELECT id, email, password_hash FROM users');
                const organizationQuery = await database.query('SELECT id, organization_name FROM organizations');
                const organizationMembershipsQuery = await database.query('SELECT organization_id, user_id, user_role FROM organization_memberships');

                expect(usersQuery.rowCount).toBe(0);
                expect(organizationQuery.rowCount).toBe(0);
                expect(organizationMembershipsQuery.rowCount).toBe(0);
            }
        )

        it(
            'duplicate email rolls back the second registration',
            async () => {
                const plainPassword = 'correct horse battery staple';
                const passwordHash = await new ArgonPasswordHasher().hash(plainPassword);

                await repository.createRegistration({
                    email: 'testemail@gmail.com',
                    organizationId: randomUUID(),
                    organizationName: 'Test Organization',
                    passwordHash: passwordHash,
                    role: 'OWNER',
                    userId: randomUUID()
                })

                await expect(repository.createRegistration({
                    email: 'testemail@gmail.com',
                    organizationId: randomUUID(),
                    organizationName: 'Test Organization',
                    passwordHash: passwordHash,
                    role: 'OWNER',
                    userId: randomUUID()
                })).rejects.toThrow(DuplicateEmailError);

                const usersQuery = await database.query('SELECT id, email, password_hash FROM users');
                const organizationQuery = await database.query('SELECT id, organization_name FROM organizations');
                const organizationMembershipsQuery = await database.query('SELECT organization_id, user_id, user_role FROM organization_memberships');

                expect(usersQuery.rowCount).toBe(1);
                expect(organizationQuery.rowCount).toBe(1);
                expect(organizationMembershipsQuery.rowCount).toBe(1);
            }
        )

        it(
            'uppercase email does not insert anything',
            async () => {
                const plainPassword = 'correct horse battery staple';
                const passwordHash = await new ArgonPasswordHasher().hash(plainPassword);

                await expect(repository.createRegistration({
                    email: 'Testemail@gmail.com',
                    organizationId: randomUUID(),
                    organizationName: 'Test Organization',
                    passwordHash: passwordHash,
                    role: 'OWNER',
                    userId: randomUUID()
                })).rejects.toThrow('users_email_check');

                const usersQuery = await database.query('SELECT id, email, password_hash FROM users');
                const organizationQuery = await database.query('SELECT id, organization_name FROM organizations');
                const organizationMembershipsQuery = await database.query('SELECT organization_id, user_id, user_role FROM organization_memberships');

                expect(usersQuery.rowCount).toBe(0);
                expect(organizationQuery.rowCount).toBe(0);
                expect(organizationMembershipsQuery.rowCount).toBe(0);
            }
        )
    }
);