import { ConfigService } from '@nestjs/config';
import { RouterAdapter } from './router.adapter.interface';
import { MockRouterAdapter } from './mock.adapter';
import { AirtelRouterAdapter } from './airtel.adapter';
import { UnsupportedRouterAdapter } from './unsupported.adapter';
export declare class RouterAdapterRegistry {
    private readonly configService;
    private readonly mockAdapter;
    private readonly airtelAdapter;
    private readonly unsupportedAdapter;
    private readonly logger;
    private readonly adapters;
    constructor(configService: ConfigService, mockAdapter: MockRouterAdapter, airtelAdapter: AirtelRouterAdapter, unsupportedAdapter: UnsupportedRouterAdapter);
    register(adapter: RouterAdapter): void;
    getActiveAdapter(): RouterAdapter;
}
