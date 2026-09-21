import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
    @ApiProperty({ description: 'User id', example: 'e2576e72-a55f-4317-a7bb-f08f61c77dce' })
    id: string;

    @ApiProperty({ description: 'User email', example: 'example@example.com' })
    email: string;
}

export class OrganizationResponseDto {
    @ApiProperty({ description: 'Organization id', example: 'e2576e72-a55f-4317-a7bb-f08f61c77dce' })
    id: string;

    @ApiProperty({
        description: 'Organization name',
        example: 'North Distribution'
    })
    name: string;
}

export class RegistrationResponseDto {
    @ApiProperty({
        description: 'User',
        type: () => UserResponseDto
    })
    user!: UserResponseDto;

    @ApiProperty({
        description: 'Organization',
        type: () => OrganizationResponseDto
    })
    organization!: OrganizationResponseDto;

    @ApiProperty({
        description: 'User role in organization',
        example: 'OWNER',
    })
    role!: string;
}