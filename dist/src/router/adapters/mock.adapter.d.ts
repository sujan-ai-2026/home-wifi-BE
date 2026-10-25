import { RouterAdapter, RouterStatusResult, RouterDevice, InterfaceCountersResult } from './router.adapter.interface';
export declare class MockRouterAdapter implements RouterAdapter {
    readonly name = "mock";
    private readonly logger;
    private startTime;
    getStatus(): Promise<RouterStatusResult>;
    getConnectedDevices(): Promise<RouterDevice[]>;
    getInterfaceCounters(): Promise<InterfaceCountersResult | null>;
}
