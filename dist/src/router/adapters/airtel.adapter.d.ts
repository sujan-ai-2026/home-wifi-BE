import { ConfigService } from '@nestjs/config';
import { RouterAdapter, RouterStatusResult, RouterDevice, InterfaceCountersResult } from './router.adapter.interface';
export declare class AirtelRouterAdapter implements RouterAdapter {
    private readonly configService;
    readonly name = "airtel";
    private readonly logger;
    private uptimeAnchorSeconds;
    private startTimestamp;
    private lastSubnetSweep;
    constructor(configService: ConfigService);
    private discoverWifiAdvertisedNames;
    private resolveDynamicDeviceDetails;
    private isAllowedTargetUrl;
    private probeRouterEndpoint;
    getStatus(): Promise<RouterStatusResult>;
    getConnectedDevices(): Promise<RouterDevice[]>;
    getInterfaceCounters(): Promise<InterfaceCountersResult | null>;
}
