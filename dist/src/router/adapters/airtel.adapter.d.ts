import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import { RouterAdapter, RouterStatusResult, RouterDevice, InterfaceCountersResult } from './router.adapter.interface';
export declare function parseLinuxArpTable(contents: string, routerSubnet: string, routerHost: string): Array<{
    ip: string;
    macClean: string;
    hostPart: string;
}>;
export declare function parseLinuxNeighborStates(contents: string, routerSubnet: string, routerHost: string): Map<string, string>;
export declare function getLocalHostDevice(routerSubnet: string, hostName: string, interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>): RouterDevice | null;
export declare class AirtelRouterAdapter implements RouterAdapter {
    private readonly configService;
    readonly name = "airtel";
    private readonly logger;
    private lastSubnetSweep;
    constructor(configService: ConfigService);
    private resolveMdnsHostnames;
    private refreshArpCache;
    private resolveDynamicDeviceDetails;
    private isAllowedTargetUrl;
    private probeRouterEndpoint;
    getStatus(): Promise<RouterStatusResult>;
    getConnectedDevices(): Promise<RouterDevice[]>;
    getInterfaceCounters(): Promise<InterfaceCountersResult | null>;
}
