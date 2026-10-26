import { Module, Global } from '@nestjs/common';
import { MockRouterAdapter } from './adapters/mock.adapter';
import { AirtelRouterAdapter } from './adapters/airtel.adapter';
import { UnsupportedRouterAdapter } from './adapters/unsupported.adapter';
import { RouterAdapterRegistry } from './adapters/router-adapter.registry';
import { RouterService } from './router.service';

@Global()
@Module({
  providers: [
    MockRouterAdapter,
    AirtelRouterAdapter,
    UnsupportedRouterAdapter,
    RouterAdapterRegistry,
    RouterService,
  ],
  exports: [RouterService, RouterAdapterRegistry],
})
export class RouterModule {}
