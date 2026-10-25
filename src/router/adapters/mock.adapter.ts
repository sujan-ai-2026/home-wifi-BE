import { Injectable, Logger } from '@nestjs/common';
import {
  RouterAdapter,
  RouterStatusResult,
  RouterDevice,
  InterfaceCountersResult,
} from './router.adapter.interface';

@Injectable()
export class MockRouterAdapter implements RouterAdapter {
  readonly name = 'mock';
  private readonly logger = new Logger(MockRouterAdapter.name);
  private startTime = Date.now() - 3600 * 24 * 5 * 1000; // 5 days uptime

  async getStatus(): Promise<RouterStatusResult> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      wanConnected: true,
      routerUptimeSeconds: uptime,
      status: 'ok',
      modelInfo: 'HomeNet Mock Fiber Gateway (Simulated)',
      source: 'mock',
    };
  }

  async getConnectedDevices(): Promise<RouterDevice[]> {
    return [
      {
        macAddress: '3C:22:FB:45:67:89',
        ipAddress: '192.168.1.10',
        hostname: 'MacBook-Pro.local',
        deviceType: 'laptop',
        connectionType: 'wifi',
        isOnline: true,
        source: 'mock_dhcp',
      },
      {
        macAddress: 'F0:18:98:12:34:56',
        ipAddress: '192.168.1.15',
        hostname: 'iPhone-15.local',
        deviceType: 'mobile',
        connectionType: 'wifi',
        isOnline: true,
        source: 'mock_dhcp',
      },
      {
        macAddress: 'B8:27:EB:AA:BB:CC',
        ipAddress: '192.168.1.20',
        hostname: 'HomeAssistant.lan',
        deviceType: 'server',
        connectionType: 'ethernet',
        isOnline: true,
        source: 'mock_arp',
      },
      {
        macAddress: 'DC:A6:32:98:76:54',
        ipAddress: '192.168.1.25',
        hostname: 'LG-Smart-TV.lan',
        deviceType: 'tv',
        connectionType: 'wifi',
        isOnline: false,
        source: 'mock_dhcp',
      },
    ];
  }

  async getInterfaceCounters(): Promise<InterfaceCountersResult | null> {
    const secondsRunning = Math.floor((Date.now() - this.startTime) / 1000);
    // Simulate incremental data transfer over time
    const received = 50000000000 + secondsRunning * 150000; // ~50GB + 150KB/s
    const transmitted = 12000000000 + secondsRunning * 40000; // ~12GB + 40KB/s
    return {
      receivedBytes: received,
      transmittedBytes: transmitted,
      source: 'mock',
    };
  }
}
