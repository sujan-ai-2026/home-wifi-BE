import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RouterAdapter } from './router.adapter.interface';
import { MockRouterAdapter } from './mock.adapter';
import { AirtelRouterAdapter } from './airtel.adapter';
import { UnsupportedRouterAdapter } from './unsupported.adapter';

@Injectable()
export class RouterAdapterRegistry {
  private readonly logger = new Logger(RouterAdapterRegistry.name);
  private readonly adapters = new Map<string, RouterAdapter>();

  constructor(
    private readonly configService: ConfigService,
    private readonly mockAdapter: MockRouterAdapter,
    private readonly airtelAdapter: AirtelRouterAdapter,
    private readonly unsupportedAdapter: UnsupportedRouterAdapter,
  ) {
    this.register(this.mockAdapter);
    this.register(this.airtelAdapter);
    this.register(this.unsupportedAdapter);
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
      this.logger.error(
        `Configured router adapter '${configuredName}' not found. No router telemetry will be collected.`,
      );
      return this.unsupportedAdapter;
    }

    return adapter;
  }
}
