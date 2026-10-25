import { Module, Global } from '@nestjs/common';
import { NetworkCollectorService } from './network-collector.service';
import { NetworkCollectorScheduler } from './network-collector.scheduler';

@Global()
@Module({
  providers: [NetworkCollectorService, NetworkCollectorScheduler],
  exports: [NetworkCollectorService],
})
export class NetworkCollectorModule {}
