import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Length, MaxLength } from "class-validator";
import { ORGANIZATION_NAME_MAX_LENGTH, ORGANIZATION_NAME_MIN_LENGTH, REGISTER_EMAIL_MAX_LENGTH, REGISTER_PASSWORD_MAX_LENGTH, REGISTER_PASSWORD_MIN_LENGTH } from "../domain/auth.js";

export class RegisterRequestDto {

    @ApiProperty({
        description: 'User email',
        example: 'example@example.com'
    })
    @IsString({
        message: 'email must be a string',
    })
    @IsNotEmpty({ message: 'email must not be empty string' })
    @IsEmail()
    @Transform(({ value }) => {
        if (typeof value === 'string') return value.toLowerCase().trim();
        else return value;
    })
    @MaxLength(
        REGISTER_EMAIL_MAX_LENGTH,
        { message: `email can not exceed ${REGISTER_EMAIL_MAX_LENGTH} characters` },
    )
    email!: string;

    @ApiProperty({
        description: 'User password',
        example: 'Secura@hight12',
        minLength: REGISTER_PASSWORD_MIN_LENGTH,
        maxLength: REGISTER_PASSWORD_MAX_LENGTH,
    })
    @IsString({
        message: 'password must be a string',
    })
    @Length(
        REGISTER_PASSWORD_MIN_LENGTH,
        REGISTER_PASSWORD_MAX_LENGTH,
        {
            message:
                `password must contain ${REGISTER_PASSWORD_MIN_LENGTH} to ${REGISTER_PASSWORD_MAX_LENGTH} characters`,
        },
    )
    password!: string;

    @ApiProperty({
        description:
            'Name of the organization',
        example: 'North Distribution',
        minLength: ORGANIZATION_NAME_MIN_LENGTH,
        maxLength: ORGANIZATION_NAME_MAX_LENGTH,
    })
    @IsString({
        message: 'organizationName must be a string',
    })
    @Length(
        ORGANIZATION_NAME_MIN_LENGTH,
        ORGANIZATION_NAME_MAX_LENGTH,
        {
            message:
                `organization name must contain ${ORGANIZATION_NAME_MIN_LENGTH} to ${ORGANIZATION_NAME_MAX_LENGTH} characters`,
        },
    )
    @Transform(({ value }) => {
        if (typeof value === 'string') return value.trim();
        else return value;
    })
    organizationName!: string;
}