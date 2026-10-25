import { ConfigService } from '@nestjs/config';
import { SpeedTestProvider, SpeedTestResult } from './speed-test-provider.interface';
import { SimulationSpeedTestProvider } from './simulation-speed-test.provider';
export declare class CliSpeedTestProvider implements SpeedTestProvider {
    private readonly configService;
    private readonly simulationProvider;
    readonly name = "cli";
    private readonly logger;
    constructor(configService: ConfigService, simulationProvider: SimulationSpeedTestProvider);
    execute(): Promise<SpeedTestResult>;
}
