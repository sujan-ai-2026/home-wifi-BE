import { InterfaceCountersResult, RouterAdapter, RouterDevice, RouterStatusResult } from './router.adapter.interface';
export declare class UnsupportedRouterAdapter implements RouterAdapter {
    readonly name = "unsupported";
    getStatus(): Promise<RouterStatusResult>;
    getConnectedDevices(): Promise<RouterDevice[]>;
    getInterfaceCounters(): Promise<InterfaceCountersResult | null>;
}
