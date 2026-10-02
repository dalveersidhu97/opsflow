import { ApiProperty } from "@nestjs/swagger";


export class UserResponseDto {
    @ApiProperty({ description: 'User id', example: 'e2576e72-a55f-4317-a7bb-f08f61c77dce' })
    id: string;

    @ApiProperty({ description: 'User email', example: 'example@example.com' })
    email: string;
}