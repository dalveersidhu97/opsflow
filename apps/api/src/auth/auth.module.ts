import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AuthController } from "./auth.controller.js";
import { authProviders } from "./infrastructure/auth.providers.js";
import { PostgresRegistrationRepository } from "./infrastructure/postgres-registration.repository.js";
import { REGISTRATION_REPOSITORY } from "./application/ports.js";
import { RegisterationService } from "./application/registeration.service.js";


@Module({
    imports: [DatabaseModule],
    controllers: [AuthController],
    providers: [
        RegisterationService,
        ...authProviders,
        {
            provide: REGISTRATION_REPOSITORY,
            useClass: PostgresRegistrationRepository,
        },
    ],
})
export class AuthModule { }