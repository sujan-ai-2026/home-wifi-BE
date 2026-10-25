import { DevicesService } from './devices.service';
import { DevicesQueryDto } from './dto/devices-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    getDevices(query: DevicesQueryDto): Promise<{
        items: {
            name: string;
            type: string;
            ip: string;
            mac: string;
            connection: string;
            status: string;
            lastSeen: string;
            usageGb: number;
            signal: number | null;
            gatewayIp: string;
            gatewayUrl: string;
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
        usageGb: number;
        signal: number | null;
        gatewayIp: string;
        gatewayUrl: string;
        gateway: {
            ip: string;
            url: string;
            name: string;
            mac: string;
            model: string;
            adminPortalUrl: string;
            status: string;
            linkType: string;
            subnetMask: string;
            dns: string[];
        };
        sessions: {
            startTime: string;
            endTime: string | null;
            durationMs: number | null;
            usageMb: number;
            source: string;
            gatewayIp?: string;
            gatewayUrl?: string;
            accessPoint?: string;
        }[];
        consumedApis: {
            url: string;
            domain: string;
            protocol: "HTTPS" | "HTTP" | "WSS" | "DNS";
            category: string;
            requestCount: number;
            dataTransferredMb: number;
            status: "active" | "idle" | "resolved";
            lastAccessed: string;
        }[];
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
