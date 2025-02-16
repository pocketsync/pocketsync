import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Current password of the user',
        example: 'currentPass123',
        nullable: true,
        type: 'string',
    })
    @IsString()
    currentPassword: string | null;

    @ApiProperty({
        description: 'New password to set (minimum 8 characters)',
        example: 'newPass123',
        minLength: 8
    })
    @IsString()
    @MinLength(8)
    newPassword: string;
}