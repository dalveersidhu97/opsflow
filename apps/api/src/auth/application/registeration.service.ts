import { Inject, Injectable } from "@nestjs/common";
import { createRegistration } from "../domain/create-registration.js";
import { PASSWORD_HASHER, REGISTRATION_ID_GENERATOR, REGISTRATION_REPOSITORY, type RegistrationIdGenerator } from "./ports.js";
import { type PasswordHasher } from "./password-hasher.js";
import { type RegistrationRepository } from "./registration-repository.js";

@Injectable()
export class RegisterationService {
    constructor(
        @Inject(REGISTRATION_REPOSITORY)
        private readonly registerRepository: RegistrationRepository,
        @Inject(REGISTRATION_ID_GENERATOR)
        private readonly registrationIdGenerator: RegistrationIdGenerator,
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasher
    ) { }

    async execute(raw: unknown) {
        const registrationBody = await createRegistration(
            raw,
            {
                newId: () => this.registrationIdGenerator.newId(),
                hash: (text: string) => this.passwordHasher.hash(text)
            }
        );
        const registrationResult = await this.registerRepository.createRegistration({
            email: registrationBody.user.email,
            organizationName: registrationBody.organization.name,
            passwordHash: registrationBody.user.passwordHash,
            organizationId: registrationBody.organization.id,
            role: registrationBody.role,
            userId: registrationBody.user.id
        })
        return registrationResult;
    }
}