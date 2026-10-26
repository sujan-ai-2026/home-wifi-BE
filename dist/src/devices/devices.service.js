"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DevicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const child_process_1 = require("child_process");
const util_1 = require("util");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
const realtime_service_1 = require("../realtime/realtime.service");
const push_service_1 = require("../push/push.service");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const syntheticDeviceSources = ['airtel_gateway'];
const DEVICE_OFFLINE_GRACE_MS = 30 * 1000;
function deviceIdentityExpression() {
    return (0, drizzle_orm_1.sql) `COALESCE(${schema_1.devices.macAddress}, ${schema_1.devices.ipAddress}, ${schema_1.devices.id})`;
}
function isLocallyAdministeredMac(mac) {
    const firstOctet = Number.parseInt(mac?.split(':')[0] ?? '', 16);
    return Number.isFinite(firstOctet) && (firstOctet & 0x02) !== 0;
}
function isUsefulDeviceName(name) {
    const normalized = name?.trim();
    return Boolean(normalized &&
        normalized !== '?' &&
        !/^unknown(?:[_\s-]|$)/i.test(normalized) &&
        !/^device\s+\(\d{1,3}(?:\.\d{1,3}){3}\)$/i.test(normalized));
}
function isSyntheticDeviceSource(source) {
    const normalizedSource = source?.toLowerCase();
    return (normalizedSource?.startsWith('mock') === true ||
        syntheticDeviceSources.includes(normalizedSource ?? ''));
}
let DevicesService = DevicesService_1 = class DevicesService {
    constructor(db, realtimeService, pushService) {
        this.db = db;
        this.realtimeService = realtimeService;
        this.pushService = pushService;
        this.logger = new common_1.Logger(DevicesService_1.name);
        this.recentAlertTimestamps = new Map();
    }
    normalizeMac(mac) {
        if (!mac)
            return null;
        const clean = mac.toUpperCase().replace(/[^A-F0-9]/g, '');
        if (clean.length !== 12)
            return mac.trim();
        return clean.match(/.{1,2}/g)?.join(':') || mac;
    }
    async listDevices(query) {
        const conditions = [
            (0, drizzle_orm_1.notLike)(schema_1.devices.source, 'mock%'),
            (0, drizzle_orm_1.notInArray)(schema_1.devices.source, syntheticDeviceSources),
        ];
        if (query.search) {
            const term = `%${query.search.trim()}%`;
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.devices.hostname, term), (0, drizzle_orm_1.ilike)(schema_1.devices.ipAddress, term)));
        }
        if (query.isOnline !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.devices.isOnline, query.isOnline));
        }
        if (query.connectionType) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.devices.connectionType, query.connectionType));
        }
        if (query.deviceType) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.devices.deviceType, query.deviceType));
        }
        if (query.fromDate) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.devices.lastSeenAt} >= ${query.fromDate}`);
        }
        if (query.toDate) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.devices.lastSeenAt} <= ${query.toDate}`);
        }
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const identity = deviceIdentityExpression();
        const [totalResult] = await this.db
            .select({ count: (0, drizzle_orm_1.countDistinct)(identity) })
            .from(schema_1.devices)
            .where(whereClause);
        const total = Number(totalResult?.count || 0);
        const distinctItems = await this.db
            .selectDistinctOn([identity])
            .from(schema_1.devices)
            .where(whereClause)
            .orderBy(identity, (0, drizzle_orm_1.desc)(schema_1.devices.isOnline), (0, drizzle_orm_1.desc)(schema_1.devices.lastSeenAt));
        const items = distinctItems
            .sort((a, b) => Number(b.isOnline) - Number(a.isOnline) ||
            b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
            .slice(query.offset, query.offset + query.limit);
        const mappedItems = items.map((d) => {
            return {
                ...d,
                name: d.hostname || 'Unknown Device',
                type: d.deviceType || 'Generic Device',
                ip: d.ipAddress || '—',
                mac: d.macAddress || '—',
                connection: d.connectionType,
                status: d.isOnline ? 'online' : 'offline',
                lastSeen: d.lastSeenAt.toISOString(),
                usageGb: null,
                signal: null,
                gatewayIp: null,
                gatewayUrl: null,
            };
        });
        return {
            items: mappedItems,
            meta: {
                page: query.page,
                limit: query.limit,
                totalItems: total,
                totalPages: Math.ceil(total / query.limit) || 1,
            },
        };
    }
    async getDeviceById(id) {
        const [device] = await this.db
            .select()
            .from(schema_1.devices)
            .where((0, drizzle_orm_1.eq)(schema_1.devices.id, id))
            .limit(1);
        if (!device) {
            throw new common_1.NotFoundException(`Device with ID ${id} not found`);
        }
        if (isSyntheticDeviceSource(device.source)) {
            throw new common_1.NotFoundException(`Device with ID ${id} not found`);
        }
        const observations = await this.db
            .select()
            .from(schema_1.deviceObservations)
            .where((0, drizzle_orm_1.eq)(schema_1.deviceObservations.deviceId, id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.deviceObservations.observedAt))
            .limit(500);
        const gatewayDevice = await this.db
            .select()
            .from(schema_1.devices)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.devices.deviceType, 'router'), (0, drizzle_orm_1.notLike)(schema_1.devices.source, 'mock%'), (0, drizzle_orm_1.notInArray)(schema_1.devices.source, syntheticDeviceSources)))
            .limit(1)
            .then(([gateway]) => gateway);
        const gatewayIp = gatewayDevice?.ipAddress ?? null;
        const gatewayUrl = gatewayIp ? `http://${gatewayIp}` : null;
        const gatewayName = gatewayDevice?.hostname ?? null;
        const gatewayMac = gatewayDevice?.macAddress ?? null;
        const gateway = {
            ip: gatewayIp,
            url: gatewayUrl,
            name: gatewayName,
            mac: gatewayMac,
            model: null,
            adminPortalUrl: gatewayUrl,
            status: gatewayDevice ? (gatewayDevice.isOnline ? 'online' : 'offline') : 'unknown',
            linkType: device.connectionType,
            subnetMask: null,
            dns: [],
        };
        const sessions = this.buildConnectionSessions(observations, device, {
            gatewayIp,
            gatewayUrl,
            gatewayName,
        });
        let totalConnectedMs = 0;
        for (const session of sessions) {
            if (session.durationMs) {
                totalConnectedMs += session.durationMs;
            }
        }
        return {
            ...device,
            name: device.hostname || 'Unknown Device',
            type: device.deviceType || 'Generic Device',
            ip: device.ipAddress || '—',
            mac: device.macAddress || '—',
            connection: device.connectionType,
            status: device.isOnline ? 'online' : 'offline',
            lastSeen: device.lastSeenAt.toISOString(),
            firstSeen: device.firstSeenAt.toISOString(),
            usageGb: null,
            signal: null,
            gatewayIp,
            gatewayUrl,
            gateway,
            sessions,
            consumedApis: [],
            totalConnectedMs,
            observationCount: observations.length,
        };
    }
    buildConnectionSessions(observations, device, gatewayInfo) {
        const gwIp = gatewayInfo?.gatewayIp ?? undefined;
        const gwUrl = gatewayInfo?.gatewayUrl ?? undefined;
        const gwName = gatewayInfo?.gatewayName ?? undefined;
        const sorted = [...observations].reverse();
        const sessions = [];
        let currentSessionStart = null;
        let currentSource = '';
        for (const obs of sorted) {
            if (obs.isOnline && !currentSessionStart) {
                currentSessionStart = obs.observedAt;
                currentSource = obs.source;
            }
            else if (!obs.isOnline && currentSessionStart) {
                const durationMs = obs.observedAt.getTime() - currentSessionStart.getTime();
                sessions.push({
                    startTime: currentSessionStart.toISOString(),
                    endTime: obs.observedAt.toISOString(),
                    durationMs,
                    usageMb: null,
                    source: currentSource || 'airtel_arp',
                    gatewayIp: gwIp,
                    gatewayUrl: gwUrl,
                    accessPoint: gwName,
                });
                currentSessionStart = null;
            }
        }
        if (currentSessionStart || (device.isOnline && sessions.length === 0)) {
            const start = currentSessionStart || device.firstSeenAt || new Date(Date.now() - 3600000);
            const durationMs = Date.now() - new Date(start).getTime();
            sessions.push({
                startTime: new Date(start).toISOString(),
                endTime: null,
                durationMs,
                usageMb: null,
                source: currentSource || device.source || 'airtel_arp',
                gatewayIp: gwIp,
                gatewayUrl: gwUrl,
                accessPoint: gwName,
            });
        }
        return sessions.reverse();
    }
    async getDeviceHistory(id, pagination) {
        await this.getDeviceById(id);
        const [totalResult] = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.deviceObservations)
            .where((0, drizzle_orm_1.eq)(schema_1.deviceObservations.deviceId, id));
        const total = Number(totalResult?.count || 0);
        const observations = await this.db
            .select()
            .from(schema_1.deviceObservations)
            .where((0, drizzle_orm_1.eq)(schema_1.deviceObservations.deviceId, id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.deviceObservations.observedAt))
            .limit(pagination.limit)
            .offset(pagination.offset);
        return {
            items: observations,
            meta: {
                page: pagination.page,
                limit: pagination.limit,
                totalItems: total,
                totalPages: Math.ceil(total / pagination.limit) || 1,
            },
        };
    }
    async isIpPingable(ip) {
        try {
            await execFileAsync('ping', ['-c', '1', '-W', '800', ip], { timeout: 1500 });
            return true;
        }
        catch {
            return false;
        }
    }
    async ingestDiscoveredDevices(discovered) {
        const liveDevices = discovered.filter((device) => !device.source.toLowerCase().startsWith('mock'));
        if (discovered.length > 0 && liveDevices.length === 0)
            return;
        const now = new Date();
        const processedIds = new Set();
        const currentSnapshot = [];
        for (const d of liveDevices) {
            const normalizedMac = this.normalizeMac(d.macAddress);
            const findByIp = async () => {
                if (!d.ipAddress)
                    return null;
                const [byIp] = await this.db
                    .select()
                    .from(schema_1.devices)
                    .where((0, drizzle_orm_1.eq)(schema_1.devices.ipAddress, d.ipAddress))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.devices.isOnline), (0, drizzle_orm_1.desc)(schema_1.devices.lastSeenAt))
                    .limit(1);
                return byIp;
            };
            let matchedDevice = null;
            if (isLocallyAdministeredMac(normalizedMac)) {
                matchedDevice = await findByIp();
            }
            if (!matchedDevice && normalizedMac && !normalizedMac.startsWith('UNKNOWN-')) {
                const [byMac] = await this.db
                    .select()
                    .from(schema_1.devices)
                    .where((0, drizzle_orm_1.eq)(schema_1.devices.macAddress, normalizedMac))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.devices.isOnline), (0, drizzle_orm_1.desc)(schema_1.devices.lastSeenAt))
                    .limit(1);
                matchedDevice = byMac;
            }
            if (!matchedDevice) {
                matchedDevice = await findByIp();
            }
            if (!matchedDevice && d.hostname && isUsefulDeviceName(d.hostname)) {
                const [byHost] = await this.db
                    .select()
                    .from(schema_1.devices)
                    .where((0, drizzle_orm_1.eq)(schema_1.devices.hostname, d.hostname))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.devices.isOnline), (0, drizzle_orm_1.desc)(schema_1.devices.lastSeenAt))
                    .limit(1);
                matchedDevice = byHost;
            }
            if (isSyntheticDeviceSource(matchedDevice?.source)) {
                matchedDevice = null;
            }
            let deviceId;
            const recentlyConfirmed = matchedDevice &&
                now.getTime() - new Date(matchedDevice.lastSeenAt).getTime() <
                    DEVICE_OFFLINE_GRACE_MS;
            const effectiveOnline = Boolean(d.isOnline || (matchedDevice?.isOnline && recentlyConfirmed));
            const hostname = isUsefulDeviceName(d.hostname)
                ? d.hostname
                : isUsefulDeviceName(matchedDevice?.hostname)
                    ? matchedDevice.hostname
                    : d.hostname;
            const deviceType = d.deviceType && d.deviceType !== 'unknown'
                ? d.deviceType
                : matchedDevice?.deviceType || d.deviceType || 'unknown';
            let shouldRecordObservation = false;
            if (matchedDevice) {
                deviceId = matchedDevice.id;
                processedIds.add(deviceId);
                const previousOnline = Boolean(matchedDevice.isOnline);
                shouldRecordObservation = previousOnline !== effectiveOnline;
                if (!previousOnline && effectiveOnline) {
                    await this.triggerDeviceAlert('connected', hostname, d.ipAddress, normalizedMac, deviceId, deviceType);
                }
                else if (previousOnline && !effectiveOnline) {
                    await this.triggerDeviceAlert('disconnected', hostname, d.ipAddress, normalizedMac, deviceId, deviceType);
                }
                await this.db
                    .update(schema_1.devices)
                    .set({
                    macAddress: normalizedMac || matchedDevice.macAddress,
                    ipAddress: d.ipAddress || matchedDevice.ipAddress,
                    hostname,
                    deviceType,
                    connectionType: d.connectionType || matchedDevice.connectionType,
                    isOnline: effectiveOnline,
                    lastSeenAt: d.isOnline ? now : matchedDevice.lastSeenAt,
                    updatedAt: now,
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.devices.id, deviceId));
            }
            else {
                if (!effectiveOnline) {
                    continue;
                }
                const [inserted] = await this.db
                    .insert(schema_1.devices)
                    .values({
                    macAddress: normalizedMac,
                    hostname,
                    ipAddress: d.ipAddress,
                    deviceType,
                    connectionType: d.connectionType || 'unknown',
                    isOnline: effectiveOnline,
                    firstSeenAt: now,
                    lastSeenAt: now,
                    source: d.source || 'router_poll',
                })
                    .returning();
                deviceId = inserted.id;
                processedIds.add(deviceId);
                shouldRecordObservation = true;
                if (effectiveOnline) {
                    await this.triggerDeviceAlert('connected', hostname, d.ipAddress, normalizedMac, deviceId, deviceType);
                }
            }
            currentSnapshot.push({
                ...d,
                macAddress: normalizedMac,
                hostname,
                deviceType,
                isOnline: effectiveOnline,
            });
            if (shouldRecordObservation) {
                await this.db.insert(schema_1.deviceObservations).values({
                    deviceId,
                    isOnline: effectiveOnline,
                    source: d.source || 'router_poll',
                    observedAt: now,
                });
            }
        }
        const allKnownDevices = await this.db
            .select()
            .from(schema_1.devices)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.devices.isOnline, true), (0, drizzle_orm_1.notLike)(schema_1.devices.source, 'mock%'), (0, drizzle_orm_1.notInArray)(schema_1.devices.source, syntheticDeviceSources)));
        for (const dev of allKnownDevices) {
            if (!processedIds.has(dev.id)) {
                const recentlyConfirmed = now.getTime() - new Date(dev.lastSeenAt).getTime() <
                    DEVICE_OFFLINE_GRACE_MS;
                if (recentlyConfirmed) {
                    const connectionType = dev.connectionType === 'wifi' || dev.connectionType === 'ethernet'
                        ? dev.connectionType
                        : 'unknown';
                    currentSnapshot.push({
                        macAddress: dev.macAddress,
                        ipAddress: dev.ipAddress,
                        hostname: dev.hostname,
                        deviceType: dev.deviceType,
                        connectionType,
                        isOnline: true,
                        source: dev.source,
                    });
                    continue;
                }
                await this.db
                    .update(schema_1.devices)
                    .set({ isOnline: false, updatedAt: now })
                    .where((0, drizzle_orm_1.eq)(schema_1.devices.id, dev.id));
                await this.db.insert(schema_1.deviceObservations).values({
                    deviceId: dev.id,
                    isOnline: false,
                    source: 'router_absence',
                    observedAt: now,
                });
                await this.triggerDeviceAlert('disconnected', dev.hostname, dev.ipAddress, dev.macAddress, dev.id, dev.deviceType);
                this.logger.log(`Device marked offline: ${dev.hostname} (${dev.ipAddress}) - missing from router list`);
            }
        }
        this.realtimeService.emitDevices({
            totalConnected: currentSnapshot.filter((device) => device.isOnline).length,
            updatedAt: now.toISOString(),
            devices: currentSnapshot,
        });
        this.realtimeService.emitDevicesListUpdated(currentSnapshot);
    }
    async triggerDeviceAlert(event, hostname, ipAddress, macAddress, deviceId, deviceType) {
        const isConn = event === 'connected';
        const metric = isConn ? 'device_connected' : 'device_disconnected';
        const debounceKey = `${event}:${ipAddress || macAddress || deviceId || hostname}`;
        const lastAlertTime = this.recentAlertTimestamps.get(debounceKey) || 0;
        if (Date.now() - lastAlertTime < 20000) {
            return;
        }
        this.recentAlertTimestamps.set(debounceKey, Date.now());
        let displayName = hostname;
        if (!displayName) {
            if (deviceType) {
                displayName = `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Device`;
            }
            else if (ipAddress) {
                displayName = `Network Device (${ipAddress})`;
            }
            else {
                displayName = 'Unknown Device';
            }
        }
        const now = new Date();
        const incidentKey = `device_${event}_${deviceId || 'unknown'}_${now.getTime()}::${displayName} (${ipAddress || 'Wi-Fi'})`;
        const title = isConn ? 'New Device Connected' : 'Device Disconnected';
        const detail = `${displayName} (${ipAddress || 'Wi-Fi'}) ${isConn ? 'joined' : 'left'} your home network.`;
        try {
            await this.db.insert(schema_1.alertEvents).values({
                incidentKey,
                metric,
                measuredValue: '1.00',
                thresholdValue: '1.00',
                severity: 'info',
                status: 'active',
                startedAt: now,
                lastBreachAt: now,
            });
            try {
                await this.pushService.sendDeviceAlertNotification({
                    event,
                    deviceName: displayName,
                    ipAddress,
                    macAddress,
                });
            }
            catch (pushErr) {
                this.logger.warn(`Web Push send error: ${pushErr.message}`);
            }
            this.realtimeService.emitAlertCreated({
                id: incidentKey,
                incidentKey,
                metric,
                measuredValue: 1,
                thresholdValue: 1,
                severity: 'info',
                status: 'active',
                startedAt: now.toISOString(),
                title,
                detail,
            });
            this.realtimeService.emitDeviceStatusChanged({
                event,
                deviceName: displayName,
                ipAddress,
                macAddress,
                title,
                detail,
                timestamp: now.toISOString(),
            });
        }
        catch (err) {
            this.logger.error(`Error triggering device alert: ${err.message}`);
        }
    }
    async clearOfflineDevices() {
        const offlineDevices = await this.db
            .select()
            .from(schema_1.devices)
            .where((0, drizzle_orm_1.eq)(schema_1.devices.isOnline, false));
        if (offlineDevices.length === 0) {
            return { message: 'No offline devices to clear', count: 0 };
        }
        const ids = offlineDevices.map((d) => d.id);
        await this.db
            .delete(schema_1.devices)
            .where((0, drizzle_orm_1.sql) `${schema_1.devices.id} IN ${ids}`);
        return {
            message: `Successfully cleared ${ids.length} offline devices from database`,
            count: ids.length,
        };
    }
    async getOnlineDeviceCount() {
        const identity = deviceIdentityExpression();
        const [result] = await this.db
            .select({ count: (0, drizzle_orm_1.countDistinct)(identity) })
            .from(schema_1.devices)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.devices.isOnline, true), (0, drizzle_orm_1.notLike)(schema_1.devices.source, 'mock%'), (0, drizzle_orm_1.notInArray)(schema_1.devices.source, syntheticDeviceSources)));
        return Number(result?.count || 0);
    }
    getConsumedApisForDevice(device, gateway) {
        const type = (device.deviceType || '').toLowerCase();
        const isOnline = Boolean(device.isOnline);
        const now = new Date();
        const gatewayUrl = gateway?.url || 'http://192.168.1.1';
        const gatewayIp = gateway?.ip || '192.168.1.1';
        const commonEndpoints = [
            {
                url: `${gatewayUrl}/api/v1/telemetry`,
                domain: gatewayIp,
                protocol: 'HTTP',
                category: 'Gateway Admin',
                requestCount: 342,
                dataTransferredMb: 14.8,
                status: isOnline ? 'active' : 'idle',
                lastAccessed: new Date(now.getTime() - 15000).toISOString(),
            },
            {
                url: 'https://dns.google/dns-query',
                domain: 'dns.google',
                protocol: 'DNS',
                category: 'DNS Resolution',
                requestCount: 1840,
                dataTransferredMb: 4.2,
                status: isOnline ? 'active' : 'idle',
                lastAccessed: new Date(now.getTime() - 5000).toISOString(),
            },
        ];
        if (type === 'laptop' || type === 'desktop' || device.source === 'local_host') {
            return [
                ...commonEndpoints,
                {
                    url: 'https://api.github.com/graphql',
                    domain: 'api.github.com',
                    protocol: 'HTTPS',
                    category: 'Developer APIs',
                    requestCount: 924,
                    dataTransferredMb: 148.6,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 25000).toISOString(),
                },
                {
                    url: 'https://gateway.icloud.com/v2/sync',
                    domain: 'gateway.icloud.com',
                    protocol: 'HTTPS',
                    category: 'Cloud Services',
                    requestCount: 1250,
                    dataTransferredMb: 312.4,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 60000).toISOString(),
                },
                {
                    url: 'https://api.openai.com/v1/chat/completions',
                    domain: 'api.openai.com',
                    protocol: 'HTTPS',
                    category: 'AI & Inference APIs',
                    requestCount: 312,
                    dataTransferredMb: 46.2,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 120000).toISOString(),
                },
                {
                    url: 'https://registry.npmjs.org/download',
                    domain: 'registry.npmjs.org',
                    protocol: 'HTTPS',
                    category: 'Package Repositories',
                    requestCount: 640,
                    dataTransferredMb: 284.1,
                    status: 'resolved',
                    lastAccessed: new Date(now.getTime() - 360000).toISOString(),
                },
                {
                    url: 'https://www.googleapis.com/youtube/v3',
                    domain: 'www.googleapis.com',
                    protocol: 'HTTPS',
                    category: 'Web Services',
                    requestCount: 480,
                    dataTransferredMb: 92.5,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 45000).toISOString(),
                },
            ];
        }
        if (type === 'tv') {
            return [
                ...commonEndpoints,
                {
                    url: 'https://api-global.netflix.com/playback/v1',
                    domain: 'api-global.netflix.com',
                    protocol: 'HTTPS',
                    category: 'Streaming & Media',
                    requestCount: 3410,
                    dataTransferredMb: 840.5,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 12000).toISOString(),
                },
                {
                    url: 'https://www.youtube.com/api/stats/playback',
                    domain: 'www.youtube.com',
                    protocol: 'HTTPS',
                    category: 'Streaming & Media',
                    requestCount: 1620,
                    dataTransferredMb: 412.3,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 40000).toISOString(),
                },
                {
                    url: 'https://hotstar.akamaized.net/hls/live',
                    domain: 'hotstar.akamaized.net',
                    protocol: 'HTTPS',
                    category: 'Content Delivery (CDN)',
                    requestCount: 2210,
                    dataTransferredMb: 610.8,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 95000).toISOString(),
                },
                {
                    url: 'https://devices.samsungcloud.com/v2/telemetry',
                    domain: 'devices.samsungcloud.com',
                    protocol: 'HTTPS',
                    category: 'Smart TV Telemetry',
                    requestCount: 145,
                    dataTransferredMb: 6.8,
                    status: 'resolved',
                    lastAccessed: new Date(now.getTime() - 300000).toISOString(),
                },
            ];
        }
        if (type === 'mobile' || type === 'smartphone') {
            return [
                ...commonEndpoints,
                {
                    url: 'wss://web.whatsapp.com/ws/chat',
                    domain: 'web.whatsapp.com',
                    protocol: 'WSS',
                    category: 'Messaging & Realtime',
                    requestCount: 2150,
                    dataTransferredMb: 86.4,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 8000).toISOString(),
                },
                {
                    url: 'https://graph.instagram.com/v18.0/feed',
                    domain: 'graph.instagram.com',
                    protocol: 'HTTPS',
                    category: 'Social Media APIs',
                    requestCount: 1420,
                    dataTransferredMb: 194.2,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 35000).toISOString(),
                },
                {
                    url: 'https://fcm.googleapis.com/fcm/connect',
                    domain: 'fcm.googleapis.com',
                    protocol: 'HTTPS',
                    category: 'Push Notifications',
                    requestCount: 890,
                    dataTransferredMb: 18.5,
                    status: isOnline ? 'active' : 'idle',
                    lastAccessed: new Date(now.getTime() - 50000).toISOString(),
                },
                {
                    url: 'https://gateway.icloud.com/photos/sync',
                    domain: 'gateway.icloud.com',
                    protocol: 'HTTPS',
                    category: 'Cloud Services',
                    requestCount: 460,
                    dataTransferredMb: 128.0,
                    status: 'resolved',
                    lastAccessed: new Date(now.getTime() - 240000).toISOString(),
                },
            ];
        }
        return [
            ...commonEndpoints,
            {
                url: 'https://tr069.airtel.in/cwmp/acs',
                domain: 'tr069.airtel.in',
                protocol: 'HTTPS',
                category: 'ISP Management (TR-069)',
                requestCount: 540,
                dataTransferredMb: 24.6,
                status: 'active',
                lastAccessed: new Date(now.getTime() - 60000).toISOString(),
            },
            {
                url: 'https://speedtest.airtel.in/v1/probe',
                domain: 'speedtest.airtel.in',
                protocol: 'HTTPS',
                category: 'Throughput & Diagnostics',
                requestCount: 88,
                dataTransferredMb: 520.0,
                status: 'idle',
                lastAccessed: new Date(now.getTime() - 180000).toISOString(),
            },
        ];
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = DevicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object, realtime_service_1.RealtimeService,
        push_service_1.PushService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map