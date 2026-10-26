import { DevicesService } from './devices.service';
import { DevicesQueryDto } from './dto/devices-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RouterService } from '../router/router.service';
export declare class DevicesController {
    private readonly devicesService;
    private readonly routerService;
    constructor(devicesService: DevicesService, routerService: RouterService);
    getLiveDevices(): Promise<{
        items: import("../router/adapters/router.adapter.interface").RouterDevice[];
        meta: {
            totalConnected: number;
            updatedAt: string;
        };
    }>;
    getDevices(query: DevicesQueryDto): Promise<{
        items: {
            name: string;
            type: string;
            ip: string;
            mac: string;
            connection: string;
            status: string;
            lastSeen: string;
            usageGb: null;
            signal: null;
            gatewayIp: null;
            gatewayUrl: null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            macAddress: string | null;
            hostname: string | null;
            ipAddress: string | null;
            deviceType: string;
            connectionType: string;
            firstSeenAt: Date;
            lastSeenAt: Date;
            isOnline: boolean;
            source: string;
        }[];
        meta: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    }>;
    getDeviceById(id: string): Promise<{
        name: string;
        type: string;
        ip: string;
        mac: string;
        connection: string;
        status: string;
        lastSeen: string;
        firstSeen: string;
        usageGb: null;
        signal: null;
        gatewayIp: string | null;
        gatewayUrl: string | null;
        gateway: {
            ip: string | null;
            url: string | null;
            name: string | null;
            mac: string | null;
            model: null;
            adminPortalUrl: string | null;
            status: string;
            linkType: string;
            subnetMask: null;
            dns: never[];
        };
        sessions: {
            startTime: string;
            endTime: string | null;
            durationMs: number | null;
            usageMb: null;
            source: string;
            gatewayIp?: string;
            gatewayUrl?: string;
            accessPoint?: string;
        }[];
        consumedApis: never[];
        totalConnectedMs: number;
        observationCount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        macAddress: string | null;
        hostname: string | null;
        ipAddress: string | null;
        deviceType: string;
        connectionType: string;
        firstSeenAt: Date;
        lastSeenAt: Date;
        isOnline: boolean;
        source: string;
    }>;
    getDeviceHistory(id: string, pagination: PaginationQueryDto): Promise<{
        items: {
            id: string;
            isOnline: boolean;
            source: string;
            deviceId: string;
            observedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    }>;
    clearOfflineDevices(): Promise<{
        message: string;
        count: number;
    }>;
}
