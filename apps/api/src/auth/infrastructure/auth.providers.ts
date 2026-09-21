import { Provider } from "@nestjs/common";
import { PASSWORD_HASHER, REGISTRATION_ID_GENERATOR, RegistrationIdGenerator } from "../application/ports.js";
import { ArgonPasswordHasher } from "./argon-password-hasher.js";
import { randomUUID } from "crypto";

export const authProviders: Provider[] = [
    {
        provide: REGISTRATION_ID_GENERATOR,
        useValue: {
            newId: () => randomUUID()
        } satisfies RegistrationIdGenerator
    },
    {
        provide: PASSWORD_HASHER,
        useClass: ArgonPasswordHasher
    }
]