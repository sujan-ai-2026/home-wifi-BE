import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public() // Allow frontend dashboard to query current thresholds
  @Get()
  @ApiOperation({ summary: 'Get application monitoring thresholds and settings' })
  @ApiResponse({ status: 200, description: 'Application settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Public()
  @Patch()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update monitoring thresholds and intervals' })
  @ApiResponse({ status: 200, description: 'Updated application settings' })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
