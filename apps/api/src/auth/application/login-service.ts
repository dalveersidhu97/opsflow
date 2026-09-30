import { Inject, Injectable } from "@nestjs/common";
import type { LoginRepository } from "./login-repository.js";
import { LOGIN_REPOSITORY, PASSWORD_HASHER, SESSION_TOKEN_PROVIDER } from "./ports.js";
import { ID_GENERATOR, type IdGenerator } from "../../common/ports/id-generator.js";
import { type Clock, CLOCK } from "../../common/ports/clock.js";
import { InvalidCredentialError } from "./invalid-credential.error.js";
import { type PasswordHasher, type SessionTokenProvider } from "./password-hasher.js";
import { SESSION_TTL_MS } from "../domain/auth.js";


@Injectable()
export class LoginService {
    constructor(
        @Inject(LOGIN_REPOSITORY)
        private readonly loginRepository: LoginRepository,
        @Inject(ID_GENERATOR)
        private readonly sessionIdGenerator: IdGenerator,
        @Inject(CLOCK)
        private readonly clock: Clock,

        @Inject(SESSION_TOKEN_PROVIDER)
        private readonly sessionProvider: SessionTokenProvider,

        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasher
    ) { }

    async login(loginInput: { email: string, password: string }): Promise<{
        user: {
            id: string;
            email: string;
        },
        session: {
            token: string;
            expiresAt: string;
        }
    }> {
        const normalizedEmail = loginInput.email.trim().toLowerCase();
        const user = await this.loginRepository.findUserByEmail(normalizedEmail);

        if (!user) throw new InvalidCredentialError();

        const passwordVerified = await this.passwordHasher.verify(loginInput.password, user.passwordHash);

        if (!passwordVerified) throw new InvalidCredentialError();

        const rawSession = this.sessionProvider.generate();
        const sessionDigest = this.sessionProvider.digest(rawSession);
        const sessionId = this.sessionIdGenerator.newId();
        const createdAt = this.clock.now();
        const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS).toISOString();

        await this.loginRepository.createSession({
            id: sessionId,
            userId: user.id,
            tokenDigest: sessionDigest,
            createdAt: createdAt.toISOString(),
            expiresAt: expiresAt
        })

        return {
            user: {
                id: user.id,
                email: user.email
            },
            session: {
                token: rawSession,
                expiresAt: expiresAt
            }
        }
    }
}