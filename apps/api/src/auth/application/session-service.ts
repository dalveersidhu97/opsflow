import { Inject, Injectable } from "@nestjs/common";
import { LOGIN_REPOSITORY, SESSION_TOKEN_PROVIDER } from "./ports.js";
import { type Clock, CLOCK } from "../../common/ports/clock.js";
import { type LoginRepository } from "./login-repository.js";
import { type SessionTokenProvider } from "./password-hasher.js";
import { InvalidSessionError } from "./invalid-session.error.js";

@Injectable()
export class SessionService {
    constructor(
        @Inject(LOGIN_REPOSITORY)
        private readonly loginRepository: LoginRepository,
        @Inject(CLOCK)
        private readonly clock: Clock,
        @Inject(SESSION_TOKEN_PROVIDER)
        private readonly sessionProvider: SessionTokenProvider,
    ) { }

    async authenticate(rawToken: string): Promise<{ id: string, email: string }> {

        if (!rawToken) throw new InvalidSessionError();

        const sessionDigest = this.sessionProvider.digest(rawToken);
        const session = await this.loginRepository.findUserBySession(sessionDigest);

        if (
            !session ||
            session.revokedAt !== null ||
            !(session.expiresAt.getTime() > this.clock.now().getTime())
        ) {
            throw new InvalidSessionError();
        }

        return {
            id: session.userId,
            email: session.email
        }
    }
}