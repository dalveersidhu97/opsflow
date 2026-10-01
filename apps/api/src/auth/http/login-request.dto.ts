import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Length, MaxLength } from "class-validator";
import { REGISTER_EMAIL_MAX_LENGTH, REGISTER_PASSWORD_MAX_LENGTH, REGISTER_PASSWORD_MIN_LENGTH } from "../domain/auth.js";

export class LoginRequestDto {
    @ApiProperty({
        description: 'User email',
        example: 'example@example.com'
    })
    @IsString({
        message: 'email must be a string',
    })
    @IsNotEmpty({ message: 'email must not be empty string' })
    @IsEmail({}, { message: "email must be a valid email string" })
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
}