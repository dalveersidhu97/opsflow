import { BadRequestException, Body, ConflictException, Controller, HttpCode, HttpStatus, Post, Res, UnauthorizedException } from "@nestjs/common";
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { ApiErrorResponseDto } from "../common/http/api-error-response.dto.js";
import { InputValidationError } from "../common/domain/input-validation.error.js";
import { RegistrationResponseDto } from "./http/register-response.dto.js";
import { RegisterRequestDto } from "./http/register-request.dto.js";
import { RegisterationService } from "./application/registeration.service.js";
import { DuplicateEmailError } from "./application/duplicate-email.error.js";
import { LoginRequestDto } from "./http/login-request.dto.js";
import { LoginResponseDto } from "./http/login-response.dto.js";
import { InvalidCredentialError } from "./application/invalid-credential.error.js";
import { LoginService } from "./application/login-service.js";
import type { Response } from "express";


@ApiTags('auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(
        private readonly registrationService: RegisterationService,
        private readonly loginService: LoginService,
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

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Login succeeded; sets the session cookie.',
        type: LoginResponseDto,
        headers: {
            'Set-Cookie': {
                description: 'HttpOnly session cookie.',
                schema: { type: 'string' },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'The request data is invalid.',
        type: ApiErrorResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Invalid email or password.',
        type: ApiErrorResponseDto,
    })
    async login(
        @Body() body: LoginRequestDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<LoginResponseDto> {
        try {
            const result = await this.loginService.login(body);

            response.cookie('opsflow_session', result.session.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                expires: new Date(result.session.expiresAt),
            });

            return {
                user: result.user,
            };
        } catch (error: unknown) {
            if (error instanceof InvalidCredentialError) {
                throw new UnauthorizedException({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                    issues: [],
                });
            }

            throw error;
        }
    }
}