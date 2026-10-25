import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'HomeNetSecurePass123!' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;
}
