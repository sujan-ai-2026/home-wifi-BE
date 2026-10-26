import { Injectable } from '@nestjs/common';
import {
  InterfaceCountersResult,
  RouterAdapter,
  RouterDevice,
  RouterStatusResult,
} from './router.adapter.interface';

@Injectable()
export class UnsupportedRouterAdapter implements RouterAdapter {
  readonly name = 'unsupported';

  async getStatus(): Promise<RouterStatusResult> {
    return {
      wanConnected: null,
      routerUptimeSeconds: null,
      status: 'unsupported',
      source: 'unsupported',
    };
  }

  async getConnectedDevices(): Promise<RouterDevice[]> {
    return [];
  }

  async getInterfaceCounters(): Promise<InterfaceCountersResult | null> {
    return null;
  }
}
