import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AuthController } from "./auth.controller.js";
import { authProviders } from "./infrastructure/auth.providers.js";
import { PostgresRegistrationRepository } from "./infrastructure/postgres-registration.repository.js";
import { LOGIN_REPOSITORY, REGISTRATION_REPOSITORY } from "./application/ports.js";
import { RegisterationService } from "./application/registeration.service.js";
import { CommonModule } from "../common/common.module.js";
import { PostgresLoginRepository } from "./infrastructure/postgres-login.repository.js";


@Module({
    imports: [DatabaseModule, CommonModule],
    controllers: [AuthController],
    providers: [
        RegisterationService,
        ...authProviders,
        {
            provide: REGISTRATION_REPOSITORY,
            useClass: PostgresRegistrationRepository,
        },
        {
            provide: LOGIN_REPOSITORY,
            useClass: PostgresLoginRepository,
        }
    ],
})
export class AuthModule { }