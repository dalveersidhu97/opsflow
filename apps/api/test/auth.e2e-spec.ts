import { INestApplication } from "@nestjs/common";
import { configureApp } from "../src/app.setup.js";
import { AppModule } from "../src/app.module.js";
import { Test } from "@nestjs/testing";
import { vi, type Mocked } from "vitest";
import setCookieParser from "set-cookie-parser";
import { LOGIN_REPOSITORY, PASSWORD_HASHER, REGISTRATION_REPOSITORY, SESSION_TOKEN_PROVIDER } from "../src/auth/application/ports.js";
import { PasswordHasher, SessionTokenProvider } from "../src/auth/application/password-hasher.js";
import { RegistrationRepository } from "../src/auth/application/registration-repository.js";
import request from 'supertest';
import { ORGANIZATION_NAME_MAX_LENGTH, ORGANIZATION_NAME_MIN_LENGTH, REGISTER_EMAIL_MAX_LENGTH, REGISTER_PASSWORD_MAX_LENGTH, REGISTER_PASSWORD_MIN_LENGTH, SESSION_TTL_MS } from "../src/auth/domain/auth.js";
import { DuplicateEmailError } from "../src/auth/application/duplicate-email.error.js";
import { RegisterationService } from "../src/auth/application/registeration.service.js";
import { ID_GENERATOR, IdGenerator } from "../src/common/ports/id-generator.js";
import { LoginRepository } from "../src/auth/application/login-repository.js";
import { Clock, CLOCK } from "../src/common/ports/clock.js";

function genStr(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, num => chars[num % chars.length]).join('');
}

describe('Auth API', () => {
    let app: INestApplication;
    const testUserId = '6ce7f9c2-3025-4250-b1b0-c934d1e47eb1';
    const testOrganizationId = '6ce7f9c2-3025-4250-b1b0-c934d1e47eb2';
    const testPasswordHash = 'TEST_HASHED_PASSWORD';
    const testDuplicateEmail = 'duplicate@email.com';
    const testDate = new Date('2026-09-30T12:00:00.000Z');
    const testRawSession = 'GENERATED_SESSION';
    const testSessionDigest = 'SESSION_DIGEST';

    let passwordHasher: Mocked<PasswordHasher>;
    let loginRepository: Mocked<LoginRepository>;

    beforeEach(async () => {
        const newId = vi.fn()
            .mockReturnValueOnce(testUserId)
            .mockReturnValueOnce(testOrganizationId);

        const clock: Clock = {
            now: () => testDate
        };

        loginRepository = {
            createSession: vi.fn(async () => { }),
            findUserByEmail: vi.fn(async (email: string) => {
                return {
                    id: testUserId,
                    email,
                    passwordHash: testPasswordHash
                }
            })
        };

        const sessionProvider: SessionTokenProvider = {
            generate: vi.fn().mockReturnValue(testRawSession),
            digest: vi.fn().mockReturnValue(testSessionDigest)
        };

        passwordHasher = { hash: vi.fn(async () => testPasswordHash), verify: vi.fn(async () => true) };

        const moduleReference =
            await Test.createTestingModule({ imports: [AppModule] })
                .overrideProvider(ID_GENERATOR)
                .useValue({ newId } satisfies IdGenerator)
                .overrideProvider(PASSWORD_HASHER)
                .useValue(passwordHasher satisfies PasswordHasher)
                .overrideProvider(REGISTRATION_REPOSITORY)
                .useValue({
                    createRegistration: async (input) => {
                        if (input.email === testDuplicateEmail) throw new DuplicateEmailError();
                        return {
                            organization: {
                                name: input.organizationName,
                                id: input.organizationId
                            },
                            user: {
                                id: input.userId,
                                email: input.email
                            },
                            role: 'OWNER'
                        }
                    }
                } satisfies RegistrationRepository)
                .overrideProvider(LOGIN_REPOSITORY)
                .useValue(loginRepository satisfies LoginRepository)
                .overrideProvider(CLOCK)
                .useValue(clock satisfies Clock)
                .overrideProvider(SESSION_TOKEN_PROVIDER)
                .useValue(sessionProvider satisfies SessionTokenProvider)
                .compile();

        app = moduleReference.createNestApplication();
        configureApp(app);
        await app.init();
    });

    afterEach(async () => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
        await app.close();
    });

    it('valid registration gets 201 approved response', async () => {
        const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send({
                email: ' Valid@email.com ',
                password: ' Valid@Password1234 ',
                organizationName: ' Valid Test Organization '
            })
            .expect(201);

        expect(response.body).toEqual({
            user: {
                id: testUserId,
                email: 'valid@email.com',
            },
            organization: {
                id: testOrganizationId,
                name: 'Valid Test Organization'
            },
            role: 'OWNER'
        })
    });

    it.each([
        {
            body: {
                invalidField: 'invaliddata'
            },
            issues: ['property invalidField should not exist'],
        },
        {
            body: {},
            issues: [
                'organizationName must be a string',
                'email must be a string',
                'password must be a string'
            ],
        },
        {
            body: undefined,
            issues: [
                'organizationName must be a string',
                'email must be a string',
                'password must be a string'
            ],
        },
        {
            body: {
                email: 'valid@gmail.com',
                password: 234,
                organizationName: ' Valid Test Organization '
            },
            issues: ['password must be a string'],
        },
        {
            body: {
                email: 'valid@gmail.com',
                password: 'valid@password.com',
                organizationName: 233
            },
            issues: ['organizationName must be a string'],
        },
        {
            body: {
                email: 123,
                password: ' Valid@Password1234 ',
                organizationName: ' Valid Test Organization '
            },
            issues: ['email must be a string'],
        },
        {
            body: {
                email: 'invalid-email',
                password: ' Valid@Password1234 ',
                organizationName: ' Valid Test Organization '
            },
            issues: ['email must be a valid email string'],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: ' invlid@P ',
                organizationName: ' Valid Test Organization '
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: genStr(REGISTER_PASSWORD_MAX_LENGTH + 1),
                organizationName: ' Valid Test Organization '
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: ' invlid@P234 ',
                organizationName: ' V '
            },
            issues: [`organization name must contain ${ORGANIZATION_NAME_MIN_LENGTH} to ${ORGANIZATION_NAME_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: ' validP@P234 ',
                organizationName: ' V '
            },
            issues: [`organization name must contain ${ORGANIZATION_NAME_MIN_LENGTH} to ${ORGANIZATION_NAME_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ' + genStr(REGISTER_EMAIL_MAX_LENGTH),
                password: ' validP@P234 ',
                organizationName: ' Valid Organization '
            },
            issues: [`email can not exceed ${REGISTER_EMAIL_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: ' validP@P234 ' + genStr(REGISTER_PASSWORD_MAX_LENGTH),
                organizationName: ' Valid Organization '
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: genStr(REGISTER_PASSWORD_MIN_LENGTH - 1),
                organizationName: ' Valid Organization '
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: genStr(REGISTER_PASSWORD_MIN_LENGTH + 1),
                organizationName: genStr(ORGANIZATION_NAME_MAX_LENGTH + 1)
            },
            issues: [`organization name must contain ${ORGANIZATION_NAME_MIN_LENGTH} to ${ORGANIZATION_NAME_MAX_LENGTH} characters`],
        },
    ])('invalid input gets 400 input validation response with no values exposed', async (input) => {
        const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send(input.body)
            .expect(400);

        expect(response.body.code).toEqual('REQUEST_VALIDATION_FAILED');
        expect(response.body.issues.length).toBeGreaterThanOrEqual(input.issues.length);
        expect(response.body.issues).toEqual(expect.arrayContaining(input.issues));
        if (input.body?.password !== undefined)
            expect(JSON.stringify(response.body)).not.includes(input.body.password);
        if (input.body?.email !== undefined)
            expect(JSON.stringify(response.body)).not.includes(input.body.email);
        if (input.body?.organizationName !== undefined)
            expect(JSON.stringify(response.body)).not.includes(input.body.organizationName);
    });

    it('password and hash are absent from response', async () => {
        const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send({
                email: ' Valid@email.com ',
                password: ' Valid@Password1234 ',
                organizationName: ' Valid Test Organization '
            })
            .expect(201);

        expect(JSON.stringify(response.body)).not.includes(testPasswordHash);
        expect(JSON.stringify(response.body)).not.includes('Valid@Password1234');
    });

    it('duplicate email gets 409 response', async () => {
        const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send({
                email: ' Duplicate@Email.com ',
                password: ' Valid@Password1234 ',
                organizationName: ' Valid Test Organization '
            })
            .expect(409);

        expect(response.body.code).toBe('EMAIL_ALREADY_REGISTERED');
    });

    it('returns 500 without exposing unexpected errors', async () => {

        const privateError = 'PRIVATE_DATABASE_FAILURE';

        const service = app.get(RegisterationService);
        vi.spyOn(
            service,
            'execute',
        ).mockRejectedValueOnce(new Error(privateError));

        const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send({
                email: ' Duplicate@Email.com ',
                password: ' Valid@Password1234 ',
                organizationName: ' Valid Test Organization '
            })
            .expect(500);
        expect(
            JSON.stringify(response.body),
        ).not.toContain(privateError);
    });

    it.each([
        {
            email: ' Valid@email.com ',
            password: 'a'.repeat(REGISTER_PASSWORD_MIN_LENGTH),
            organizationName: ' Valid Test Organization '
        },
        {
            email: ' Valid@email.com ',
            password: 'a'.repeat(REGISTER_PASSWORD_MAX_LENGTH),
            organizationName: ' Valid Test Organization '
        }
    ])('password of exactly minimum and maximum length gets 201 approved response', async (validInput) => {
        const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send(validInput)
            .expect(201);

        expect(response.body).toEqual({
            user: {
                id: testUserId,
                email: 'valid@email.com',
            },
            organization: {
                id: testOrganizationId,
                name: 'Valid Test Organization'
            },
            role: 'OWNER'
        })
    });

    it('valid request with extra role property get 400 response', async () => {
        const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send({
                email: ' Valid@email.com ',
                password: 'a'.repeat(REGISTER_PASSWORD_MIN_LENGTH),
                organizationName: ' Valid Test Organization ',
                role: 'ADMIN'
            },)
            .expect(400);

        expect(response.body.code).toEqual('REQUEST_VALIDATION_FAILED');
        expect(response.body.issues).toEqual(expect.arrayContaining(['property role should not exist']));
    });

    it('valid login request with valid email and password get 200 OK', async () => {
        vi.stubEnv("NODE_ENV", "production");
        const response = await request(app.getHttpServer())
            .post('/v1/auth/login')
            .send({
                email: ' Valid@email.com ',
                password: ' valid password 2'
            },)
            .expect(200);

        const normalizedEmail = 'valid@email.com';

        expect(response.body).toEqual({ user: { id: testUserId, email: normalizedEmail } });
        const cookies = setCookieParser.parse(response.headers["set-cookie"]);
        const sessionCookie = cookies.find(cookie => cookie.name === "opsflow_session");

        expect(sessionCookie).toBeDefined();
        expect(sessionCookie?.value).toBe(testRawSession);
        expect(sessionCookie?.httpOnly).toBe(true);
        expect(sessionCookie?.secure).toBe(true);
        expect(sessionCookie?.sameSite).toBe("Lax");
        expect(sessionCookie?.path).toBe('/');

        const sessionExpires = new Date(testDate.getTime() + SESSION_TTL_MS);
        expect(sessionCookie?.expires?.getTime()).toBe(Math.floor(sessionExpires.getTime() / 1000) * 1000);
    });

    it('wrong password gets unauthorized response', async () => {
        vi.stubEnv("NODE_ENV", "production");
        passwordHasher.verify.mockResolvedValueOnce(false);
        const response = await request(app.getHttpServer())
            .post('/v1/auth/login')
            .send({
                email: ' Valid@email.com ',
                password: ' valid password 2'
            },)
            .expect(401);

        expect(response.body.user).not.toBeDefined();
        expect(response.body.code).toBe('INVALID_CREDENTIALS');
        expect(response.body.message).toBe('Invalid email or password');
        const cookies = setCookieParser.parse(response.headers["set-cookie"]);
        const sessionCookie = cookies.find(cookie => cookie.name === "opsflow_session");
        expect(sessionCookie).not.toBeDefined();
    });

    it('wrong email gets unauthorized response', async () => {
        vi.stubEnv("NODE_ENV", "production");
        loginRepository.findUserByEmail.mockResolvedValueOnce(null);
        const response = await request(app.getHttpServer())
            .post('/v1/auth/login')
            .send({
                email: ' Valid@email.com ',
                password: ' valid password 2'
            },)
            .expect(401);

        expect(response.body.user).not.toBeDefined();
        expect(response.body.code).toBe('INVALID_CREDENTIALS');
        expect(response.body.message).toBe('Invalid email or password');
        const cookies = setCookieParser.parse(response.headers["set-cookie"]);
        const sessionCookie = cookies.find(cookie => cookie.name === "opsflow_session");
        expect(sessionCookie).not.toBeDefined();
    });

    it.each([
        {
            body: {
                invalidField: 'invaliddata'
            },
            issues: ['property invalidField should not exist'],
        },
        {
            body: {},
            issues: [
                'email must be a string',
                'password must be a string'
            ],
        },
        {
            body: undefined,
            issues: [
                'email must be a string',
                'password must be a string'
            ],
        },
        {
            body: {
                email: 'valid@gmail.com',
                password: 234
            },
            issues: ['password must be a string'],
        },
        {
            body: {
                email: 123,
                password: ' Valid@Password1234 ',
            },
            issues: ['email must be a string'],
        },
        {
            body: {
                email: 'invalid-email',
                password: ' Valid@Password1234 '
            },
            issues: ['email must be a valid email string'],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: ' invlid@P '
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: genStr(REGISTER_PASSWORD_MAX_LENGTH + 1)
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ' + genStr(REGISTER_EMAIL_MAX_LENGTH),
                password: ' validP@P234 '
            },
            issues: [`email can not exceed ${REGISTER_EMAIL_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: ' validP@P234 ' + genStr(REGISTER_PASSWORD_MAX_LENGTH)
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        },
        {
            body: {
                email: ' Valid@email.com ',
                password: genStr(REGISTER_PASSWORD_MIN_LENGTH - 1)
            },
            issues: [`password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`],
        }
    ])('invalid input gets 400 input validation response with no values exposed', async (input) => {
        const response = await request(app.getHttpServer())
            .post('/v1/auth/login')
            .send(input.body)
            .expect(400);

        expect(response.body.code).toEqual('REQUEST_VALIDATION_FAILED');
        expect(response.body.issues.length).toBeGreaterThanOrEqual(input.issues.length);
        expect(response.body.issues).toEqual(expect.arrayContaining(input.issues));

        const responseText = JSON.stringify(response.body);
        if (input.body?.password !== undefined) expect(responseText).not.toContain(String(input.body.password));
        if (input.body?.email !== undefined) expect(responseText).not.toContain(String(input.body.email));

        const cookies = setCookieParser.parse(response.headers["set-cookie"]);
        const sessionCookie = cookies.find(cookie => cookie.name === "opsflow_session");
        expect(sessionCookie).not.toBeDefined();
    });

    it('rjects persistence faliure with general server error', async () => {
        const persistenseFailure = new Error('Database error');
        loginRepository.createSession.mockRejectedValueOnce(persistenseFailure);
        const response = await request(app.getHttpServer())
            .post('/v1/auth/login')
            .send({
                email: ' Valid@email.com ',
                password: ' valid password 2'
            })
            .expect(500);
        expect(JSON.stringify(response.body)).not.toContain('valid password 2');
        expect(JSON.stringify(response.body)).not.toContain('valid@email.com');
        expect(response.body.message).toBe('Internal server error');

        const cookies = setCookieParser.parse(response.headers["set-cookie"]);
        const sessionCookie = cookies.find(cookie => cookie.name === "opsflow_session");
        expect(sessionCookie).not.toBeDefined();
    });
})