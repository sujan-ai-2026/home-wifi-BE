import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PushService } from './push.service';
import { PushSubscriptionDto, UnsubscribeDto } from './dto/push-subscription.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('push')
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Get Web Push VAPID configuration status and public key' })
  @ApiResponse({ status: 200, description: 'Push notification status' })
  getStatus() {
    return this.pushService.getStatus();
  }

  @Public() // Allow frontend PWA client to subscribe with client-side user context
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a Web Push notification subscription' })
  @ApiResponse({ status: 200, description: 'Subscription created or updated' })
  async subscribe(
    @Body() dto: PushSubscriptionDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const userId = user?.userId || 'owner';
    return this.pushService.subscribe(userId, dto);
  }

  @Public()
  @Delete('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from Web Push notifications' })
  @ApiResponse({ status: 200, description: 'Subscription removed' })
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.pushService.unsubscribe(dto.endpoint);
  }
}
