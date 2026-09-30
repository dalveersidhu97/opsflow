import { Provider } from "@nestjs/common";
import { PASSWORD_HASHER, SESSION_TOKEN_PROVIDER } from "../application/ports.js";
import { ArgonPasswordHasher } from "./argon-password-hasher.js";
import { CryptoSessionTokenProvider } from "./crypto-session-token.provider.js";

export const authProviders: Provider[] = [
    {
        provide: PASSWORD_HASHER,
        useClass: ArgonPasswordHasher
    },
    {
        provide: SESSION_TOKEN_PROVIDER,
        useClass: CryptoSessionTokenProvider,
    }
]