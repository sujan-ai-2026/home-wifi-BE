import { NetworkCollectorService } from './network-collector.service';
import { RouterService } from '../router/router.service';
import { DevicesService } from '../devices/devices.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AlertsService } from '../alerts/alerts.service';
export declare class NetworkCollectorScheduler {
    private readonly collectorService;
    private readonly routerService;
    private readonly devicesService;
    private readonly realtimeService;
    private readonly alertsService;
    private readonly logger;
    private isCollecting;
    constructor(collectorService: NetworkCollectorService, routerService: RouterService, devicesService: DevicesService, realtimeService: RealtimeService, alertsService: AlertsService);
    handleAlertPurge(): Promise<void>;
    handlePeriodicCollection(): Promise<void>;
}
