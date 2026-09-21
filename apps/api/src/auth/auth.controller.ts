import { BadRequestException, Body, ConflictException, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiErrorResponseDto } from "../common/http/api-error-response.dto.js";
import { InputValidationError } from "../common/domain/input-validation.error.js";
import { RegistrationResponseDto } from "./http/register-response.dto.js";
import { RegisterRequestDto } from "./http/register-request.dto.js";
import { RegisterationService } from "./application/registeration.service.js";
import { DuplicateEmailError } from "./application/duplicate-email.error.js";


@ApiTags('auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(
        private readonly registrationService: RegisterationService
    ) { }

    @Post('register')
    @ApiOperation({
        summary: 'Register user in ogranization',
    })
    @ApiCreatedResponse({
        description: 'The registration was successfull.',
        type: RegistrationResponseDto,
    })
    @ApiBadRequestResponse({
        description: 'The request data is invalid.',
        type: ApiErrorResponseDto,
    })
    @ApiConflictResponse({
        description: 'The request email already exists.',
        type: ApiErrorResponseDto,
        example: {
            statusCode: HttpStatus.CONFLICT,
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'Email already exists',
            issues: [],
        },
    })
    async register(
        @Body()
        body: RegisterRequestDto,
    ): Promise<RegistrationResponseDto> {
        try {
            const result = await this.registrationService.execute(body);
            return {
                role: result.role,
                user: {
                    id: result.user.id,
                    email: result.user.email
                },
                organization: {
                    id: result.organization.id,
                    name: result.organization.name
                }
            }
        } catch (error: unknown) {
            if (error instanceof InputValidationError) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    code: 'REGISTRATION_INPUT_INVALID',
                    message: 'Registeration input is invalid',
                    issues: error.issues,
                });
            } else if (error instanceof DuplicateEmailError) {
                throw new ConflictException({
                    statusCode: HttpStatus.CONFLICT,
                    code: 'EMAIL_ALREADY_REGISTERED',
                    message: 'Email already exists',
                    issues: [],
                });
            }
            throw error;
        }
    }
}