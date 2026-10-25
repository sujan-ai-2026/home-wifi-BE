import { ConfigService } from '@nestjs/config';
import { RouterAdapter } from './router.adapter.interface';
import { MockRouterAdapter } from './mock.adapter';
import { AirtelRouterAdapter } from './airtel.adapter';
export declare class RouterAdapterRegistry {
    private readonly configService;
    private readonly mockAdapter;
    private readonly airtelAdapter;
    private readonly logger;
    private readonly adapters;
    constructor(configService: ConfigService, mockAdapter: MockRouterAdapter, airtelAdapter: AirtelRouterAdapter);
    register(adapter: RouterAdapter): void;
    getActiveAdapter(): RouterAdapter;
}
