import { Response } from 'express';
import { Pool } from 'pg';
export declare class HealthController {
    private readonly pool;
    constructor(pool: Pool);
    check(res: Response): Promise<Response<any, Record<string, any>>>;
}
