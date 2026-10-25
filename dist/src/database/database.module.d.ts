import { OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
export declare class DatabaseModule implements OnApplicationShutdown {
    private readonly pool;
    private readonly logger;
    constructor(pool: Pool);
    onApplicationShutdown(signal?: string): Promise<void>;
}
