import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RouterAdapter } from './router.adapter.interface';
import { MockRouterAdapter } from './mock.adapter';
import { AirtelRouterAdapter } from './airtel.adapter';

@Injectable()
export class RouterAdapterRegistry {
  private readonly logger = new Logger(RouterAdapterRegistry.name);
  private readonly adapters = new Map<string, RouterAdapter>();

  constructor(
    private readonly configService: ConfigService,
    private readonly mockAdapter: MockRouterAdapter,
    private readonly airtelAdapter: AirtelRouterAdapter,
  ) {
    this.register(this.mockAdapter);
    this.register(this.airtelAdapter);
  }

  register(adapter: RouterAdapter) {
    this.adapters.set(adapter.name.toLowerCase(), adapter);
  }

  getActiveAdapter(): RouterAdapter {
    const configuredName = (
      this.configService.get<string>('app.routerAdapter') || 'mock'
    ).toLowerCase();

    const adapter = this.adapters.get(configuredName);
    if (!adapter) {
      this.logger.warn(
        `Configured router adapter '${configuredName}' not found. Falling back to 'mock'.`,
      );
      return this.mockAdapter;
    }

    return adapter;
  }
}
