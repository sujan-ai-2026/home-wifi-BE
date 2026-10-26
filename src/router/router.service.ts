import { Injectable, Inject, Logger } from '@nestjs/common';
import { and, desc, notInArray, notLike } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleDb } from '../database/database.provider';
import { routerSnapshots } from '../database/schema';
import { RouterAdapterRegistry } from './adapters/router-adapter.registry';
import { RouterStatusResult, RouterDevice } from './adapters/router.adapter.interface';

@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  constructor(
    @Inject(DRIZZLE_ORM) private readonly db: DrizzleDb,
    private readonly registry: RouterAdapterRegistry,
  ) {}

  async pollAndPersistSnapshot(): Promise<RouterStatusResult> {
    const adapter = this.registry.getActiveAdapter();
    const status = await adapter.getStatus();
    const counters = await adapter.getInterfaceCounters();

    if (
      status.source.toLowerCase().startsWith('mock') ||
      status.source === 'airtel_gateway' ||
      counters?.source.toLowerCase().startsWith('mock')
    ) {
      this.logger.warn('Skipping persistence of mock router snapshot data');
      return status;
    }

    try {
      await this.db.insert(routerSnapshots).values({
        wanConnected: status.wanConnected,
        routerUptimeSeconds: status.routerUptimeSeconds,
        receivedBytes: counters?.receivedBytes ?? null,
        transmittedBytes: counters?.transmittedBytes ?? null,
        source: status.source,
        status: status.status,
        observedAt: new Date(),
      });
    } catch (err: any) {
      this.logger.error(`Failed to persist router snapshot: ${err.message}`);
    }

    return status;
  }

  async getLatestSnapshot() {
    const [latest] = await this.db
      .select()
      .from(routerSnapshots)
      .where(
        and(
          notLike(routerSnapshots.source, 'mock%'),
          notInArray(routerSnapshots.source, ['airtel_gateway', 'airtel_counters']),
        ),
      )
      .orderBy(desc(routerSnapshots.observedAt))
      .limit(1);

    return latest || null;
  }

  async getConnectedDevices(): Promise<RouterDevice[]> {
    const adapter = this.registry.getActiveAdapter();
    return adapter.getConnectedDevices();
  }
}
