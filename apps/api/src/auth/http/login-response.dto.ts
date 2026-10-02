import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "./user-response.dto.js";

export class LoginResponseDto {
    @ApiProperty({
        description: 'User',
        type: () => UserResponseDto
    })
    user!: UserResponseDto;
}