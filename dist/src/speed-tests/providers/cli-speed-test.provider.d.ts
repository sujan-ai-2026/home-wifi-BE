import { ConfigService } from '@nestjs/config';
import { SpeedTestProvider, SpeedTestResult } from './speed-test-provider.interface';
export declare class CliSpeedTestProvider implements SpeedTestProvider {
    private readonly configService;
    readonly name = "cli";
    private readonly logger;
    constructor(configService: ConfigService);
    execute(): Promise<SpeedTestResult>;
}
