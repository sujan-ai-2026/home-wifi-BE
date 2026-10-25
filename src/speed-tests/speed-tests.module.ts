import { Module, Global } from '@nestjs/common';
import { SpeedTestsController } from './speed-tests.controller';
import { SpeedTestsService } from './speed-tests.service';
import { SpeedTestScheduler } from './speed-test.scheduler';
import { CliSpeedTestProvider } from './providers/cli-speed-test.provider';
import { SimulationSpeedTestProvider } from './providers/simulation-speed-test.provider';

@Global()
@Module({
  controllers: [SpeedTestsController],
  providers: [
    SimulationSpeedTestProvider,
    CliSpeedTestProvider,
    SpeedTestsService,
    SpeedTestScheduler,
  ],
  exports: [SpeedTestsService],
})
export class SpeedTestsModule {}
