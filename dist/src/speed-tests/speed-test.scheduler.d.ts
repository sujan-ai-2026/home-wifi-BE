import { SpeedTestsService } from './speed-tests.service';
export declare class SpeedTestScheduler {
    private readonly speedTestsService;
    private readonly logger;
    constructor(speedTestsService: SpeedTestsService);
    handleScheduledSpeedTest(): Promise<void>;
}
