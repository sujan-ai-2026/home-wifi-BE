import { Module, Global } from '@nestjs/common';
import { MockRouterAdapter } from './adapters/mock.adapter';
import { AirtelRouterAdapter } from './adapters/airtel.adapter';
import { RouterAdapterRegistry } from './adapters/router-adapter.registry';
import { RouterService } from './router.service';

@Global()
@Module({
  providers: [
    MockRouterAdapter,
    AirtelRouterAdapter,
    RouterAdapterRegistry,
    RouterService,
  ],
  exports: [RouterService, RouterAdapterRegistry],
})
export class RouterModule {}
