import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
    @ApiProperty({
        example: 400,
    })
    statusCode!: number;

    @ApiProperty({
        example: 'REQUEST_VALIDATION_FAILED',
    })
    code!: string;

    @ApiProperty({
        example: 'Request validation failed',
    })
    message!: string;

    @ApiProperty({
        type: [String],
        example: [
            'title must contain 5 to 120 characters',
        ],
    })
    issues!: string[];
}