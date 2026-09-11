import {
    BadRequestException,
    HttpStatus,
    ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function collectValidationMessages(
    errors: ValidationError[],
): string[] {
    const messages: string[] = [];

    for (const error of errors) {
        messages.push(
            ...Object.values(error.constraints ?? {}),
        );

        if (error.children?.length) {
            messages.push(
                ...collectValidationMessages(
                    error.children,
                ),
            );
        }
    }

    return messages;
}

export function createRequestValidationPipe():
    ValidationPipe {
    return new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,

        validationError: {
            target: false,
            value: false,
        },

        exceptionFactory: (
            errors: ValidationError[],
        ) =>
            new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                code: 'REQUEST_VALIDATION_FAILED',
                message: 'Request validation failed',
                issues:
                    collectValidationMessages(errors),
            }),
    });
}