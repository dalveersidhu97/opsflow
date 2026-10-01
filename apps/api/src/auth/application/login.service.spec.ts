import { Clock } from "../../common/ports/clock.js";
import { IdGenerator } from "../../common/ports/id-generator.js";
import { SESSION_TTL_MS } from "../domain/auth.js";
import { InvalidCredentialError } from "./invalid-credential.error.js";
import { LoginRepository } from "./login-repository.js";
import { LoginService } from "./login-service.js";
import { PasswordHasher, SessionTokenProvider } from "./password-hasher.js";


describe('loginService', () => {

    it('returns created session and user for valid credentials', async () => {
        const testData = {
            userId: 'USER_ID',
            sessionId: 'SESSION_ID',
            email: '  Example@email.com  ',
            passwordHash: 'PASSWORD_HASH',
            password: ' PASSWORD exact ',
            rawSession: 'GENERATED_SESSION',
            sessionDigest: 'SESSION_DIGEST',
            date: new Date('2026-09-30T12:00:00.000Z')
        };

        const loginRepository: LoginRepository = {
            createSession: vi.fn(async () => { }),
            findUserByEmail: vi.fn(async (email: string) => {
                return {
                    id: testData.userId,
                    email,
                    passwordHash: testData.passwordHash
                }
            })
        };
        const sessionIdGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(testData.sessionId)
        };
        const clock: Clock = {
            now: () => testData.date
        };
        const sessionProvider: SessionTokenProvider = {
            generate: vi.fn().mockReturnValue(testData.rawSession),
            digest: vi.fn().mockReturnValue(testData.sessionDigest)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValueOnce(testData.passwordHash),
            verify: vi.fn().mockResolvedValue(true)
        };

        const service = new LoginService(loginRepository, sessionIdGenerator, clock, sessionProvider, passwordHasher);

        const result = await service.login({
            email: testData.email,
            password: testData.password
        });

        const normalizedEmail = testData.email.toLowerCase().trim();
        const sessionExpires = new Date(testData.date.getTime() + SESSION_TTL_MS).toISOString();

        expect(result).toEqual({
            user: {
                id: testData.userId,
                email: normalizedEmail
            },
            session: {
                token: testData.rawSession,
                expiresAt: sessionExpires
            }
        });

        expect(loginRepository.findUserByEmail).toHaveBeenCalledExactlyOnceWith(normalizedEmail);
        expect(loginRepository.createSession).toHaveBeenCalledExactlyOnceWith({
            id: testData.sessionId,
            userId: testData.userId,
            tokenDigest: testData.sessionDigest,
            createdAt: testData.date.toISOString(),
            expiresAt: sessionExpires
        });
        expect(passwordHasher.verify).toHaveBeenCalledExactlyOnceWith(testData.password, testData.passwordHash);
        expect(sessionProvider.digest).toHaveBeenCalledExactlyOnceWith(testData.rawSession);
    });

    it('rejects an unknown email without creating a session.', async () => {
        const testData = {
            userId: 'USER_ID',
            sessionId: 'SESSION_ID',
            email: '  Example@email.com  ',
            passwordHash: 'PASSWORD_HASH',
            password: ' PASSWORD exact ',
            rawSession: 'GENERATED_SESSION',
            sessionDigest: 'SESSION_DIGEST',
            date: new Date('2026-09-30T12:00:00.000Z')
        };

        const loginRepository: LoginRepository = {
            createSession: vi.fn(async () => { }),
            findUserByEmail: vi.fn().mockResolvedValue(null)
        };
        const sessionIdGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(testData.sessionId)
        };
        const clock: Clock = {
            now: () => testData.date
        };
        const sessionProvider: SessionTokenProvider = {
            generate: vi.fn().mockReturnValue(testData.rawSession),
            digest: vi.fn().mockReturnValue(testData.sessionDigest)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValueOnce(testData.passwordHash),
            verify: vi.fn().mockResolvedValue(true)
        };

        const service = new LoginService(loginRepository, sessionIdGenerator, clock, sessionProvider, passwordHasher);

        const loginPromise = service.login({
            email: testData.email,
            password: testData.password
        });

        const normalizedEmail = testData.email.toLowerCase().trim();

        await expect(loginPromise).rejects.toBeInstanceOf(InvalidCredentialError);

        expect(loginRepository.findUserByEmail).toHaveBeenCalledExactlyOnceWith(normalizedEmail);
        expect(loginRepository.createSession).not.toHaveBeenCalled();
        expect(passwordHasher.verify).not.toHaveBeenCalled();
        expect(sessionProvider.digest).not.toHaveBeenCalled();
    });

    it('rejects an incorrect password without creating a session.', async () => {
        const testData = {
            userId: 'USER_ID',
            sessionId: 'SESSION_ID',
            email: '  Example@email.com  ',
            passwordHash: 'PASSWORD_HASH',
            password: ' PASSWORD exact ',
            rawSession: 'GENERATED_SESSION',
            sessionDigest: 'SESSION_DIGEST',
            date: new Date('2026-09-30T12:00:00.000Z')
        };

        const loginRepository: LoginRepository = {
            createSession: vi.fn(async () => { }),
            findUserByEmail: vi.fn(async (email: string) => {
                return {
                    id: testData.userId,
                    email,
                    passwordHash: testData.passwordHash
                }
            })
        };
        const sessionIdGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(testData.sessionId)
        };
        const clock: Clock = {
            now: () => testData.date
        };
        const sessionProvider: SessionTokenProvider = {
            generate: vi.fn().mockReturnValue(testData.rawSession),
            digest: vi.fn().mockReturnValue(testData.sessionDigest)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValueOnce(testData.passwordHash),
            verify: vi.fn().mockResolvedValue(false)
        };

        const service = new LoginService(loginRepository, sessionIdGenerator, clock, sessionProvider, passwordHasher);

        const loginPromise = service.login({
            email: testData.email,
            password: testData.password
        });

        const normalizedEmail = testData.email.toLowerCase().trim();

        await expect(loginPromise).rejects.toBeInstanceOf(InvalidCredentialError);

        expect(loginRepository.findUserByEmail).toHaveBeenCalledExactlyOnceWith(normalizedEmail);
        expect(passwordHasher.verify).toHaveBeenCalledExactlyOnceWith(testData.password, testData.passwordHash);
        expect(loginRepository.createSession).not.toHaveBeenCalled();
        expect(sessionProvider.digest).not.toHaveBeenCalled();
    });

    it('rejects if session persistence fails', async () => {
        const testData = {
            userId: 'USER_ID',
            sessionId: 'SESSION_ID',
            email: '  Example@email.com  ',
            passwordHash: 'PASSWORD_HASH',
            password: ' PASSWORD exact ',
            rawSession: 'GENERATED_SESSION',
            sessionDigest: 'SESSION_DIGEST',
            date: new Date('2026-09-30T12:00:00.000Z')
        };

        const persistenceError = new Error('Session storage unavailable');

        const loginRepository: LoginRepository = {
            createSession: vi.fn().mockRejectedValue(persistenceError),
            findUserByEmail: vi.fn(async (email: string) => {
                return {
                    id: testData.userId,
                    email,
                    passwordHash: testData.passwordHash
                }
            })
        };
        const sessionIdGenerator: IdGenerator = {
            newId: vi.fn().mockReturnValueOnce(testData.sessionId)
        };
        const clock: Clock = {
            now: () => testData.date
        };
        const sessionProvider: SessionTokenProvider = {
            generate: vi.fn().mockReturnValue(testData.rawSession),
            digest: vi.fn().mockReturnValue(testData.sessionDigest)
        };
        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValueOnce(testData.passwordHash),
            verify: vi.fn().mockResolvedValue(true)
        };

        const service = new LoginService(loginRepository, sessionIdGenerator, clock, sessionProvider, passwordHasher);

        const loginPromise = service.login({
            email: testData.email,
            password: testData.password
        });

        const normalizedEmail = testData.email.toLowerCase().trim();
        const sessionExpires = new Date(testData.date.getTime() + SESSION_TTL_MS).toISOString();

        await expect(loginPromise).rejects.toBe(persistenceError);

        expect(loginRepository.findUserByEmail).toHaveBeenCalledExactlyOnceWith(normalizedEmail);
        expect(loginRepository.createSession).toHaveBeenCalledExactlyOnceWith({
            id: testData.sessionId,
            userId: testData.userId,
            tokenDigest: testData.sessionDigest,
            createdAt: testData.date.toISOString(),
            expiresAt: sessionExpires
        });
        expect(passwordHasher.verify).toHaveBeenCalledExactlyOnceWith(testData.password, testData.passwordHash);
        expect(sessionProvider.digest).toHaveBeenCalledExactlyOnceWith(testData.rawSession);
    });
});