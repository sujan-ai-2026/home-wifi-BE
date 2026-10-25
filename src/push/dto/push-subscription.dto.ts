import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PushSubscriptionKeysDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class PushSubscriptionDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty({ type: PushSubscriptionKeysDto })
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;
}

export class UnsubscribeDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  endpoint!: string;
}
