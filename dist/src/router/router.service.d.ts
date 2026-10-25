import { DrizzleDb } from '../database/database.provider';
import { RouterAdapterRegistry } from './adapters/router-adapter.registry';
import { RouterStatusResult, RouterDevice } from './adapters/router.adapter.interface';
export declare class RouterService {
    private readonly db;
    private readonly registry;
    private readonly logger;
    constructor(db: DrizzleDb, registry: RouterAdapterRegistry);
    pollAndPersistSnapshot(): Promise<RouterStatusResult>;
    getLatestSnapshot(): Promise<{
        status: string;
        id: string;
        source: string;
        observedAt: Date;
        wanConnected: boolean | null;
        routerUptimeSeconds: number | null;
        receivedBytes: number | null;
        transmittedBytes: number | null;
    }>;
    getConnectedDevices(): Promise<RouterDevice[]>;
}
