import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "./register-response.dto.js";


export class LoginResponseDto {
    @ApiProperty({
        description: 'User',
        type: () => UserResponseDto
    })
    user!: UserResponseDto;
}