import { Inject, Injectable } from "@nestjs/common";
import { createRegistration } from "../domain/create-registration.js";
import { PASSWORD_HASHER, REGISTRATION_REPOSITORY } from "./ports.js";
import { type PasswordHasher } from "./password-hasher.js";
import { type RegistrationRepository } from "./registration-repository.js";
import { ID_GENERATOR, type IdGenerator } from "../../common/ports/id-generator.js";

@Injectable()
export class RegisterationService {
    constructor(
        @Inject(REGISTRATION_REPOSITORY)
        private readonly registerRepository: RegistrationRepository,
        @Inject(ID_GENERATOR)
        private readonly registrationIdGenerator: IdGenerator,
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