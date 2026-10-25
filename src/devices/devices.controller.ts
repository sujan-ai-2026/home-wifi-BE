import { Controller, Get, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { DevicesQueryDto } from './dto/devices-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';


@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List connected and historical home network devices' })
  @ApiResponse({ status: 200, description: 'Paginated devices list' })
  async getDevices(@Query() query: DevicesQueryDto) {
    return this.devicesService.listDevices(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get details for a specific device' })
  @ApiResponse({ status: 200, description: 'Device details' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDeviceById(@Param('id') id: string) {
    return this.devicesService.getDeviceById(id);
  }

  @Public()
  @Get(':id/history')
  @ApiOperation({ summary: 'Get online/offline observation history for a device' })
  @ApiResponse({ status: 200, description: 'Device observation history' })
  async getDeviceHistory(
    @Param('id') id: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.devicesService.getDeviceHistory(id, pagination);
  }

  @Public()
  @Delete('offline')
  @ApiOperation({ summary: 'Remove all offline devices from database' })
  @ApiResponse({ status: 200, description: 'Offline devices cleared (or none found)' })
  async clearOfflineDevices() {
    return this.devicesService.clearOfflineDevices();
  }
}
