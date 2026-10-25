import { SpeedTestProvider, SpeedTestResult } from './speed-test-provider.interface';
export declare class SimulationSpeedTestProvider implements SpeedTestProvider {
    readonly name = "simulation";
    private readonly logger;
    execute(): Promise<SpeedTestResult>;
}
