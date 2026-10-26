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
var AirtelRouterAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtelRouterAdapter = void 0;
exports.parseLinuxArpTable = parseLinuxArpTable;
exports.parseLinuxNeighborStates = parseLinuxNeighborStates;
exports.getLocalHostDevice = getLocalHostDevice;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const https = require("https");
const http = require("http");
const os = require("os");
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
function parseLinuxArpTable(contents, routerSubnet, routerHost) {
    return contents
        .split('\n')
        .slice(1)
        .flatMap((line) => {
        const [ip, , flags, mac] = line.trim().split(/\s+/);
        if (!ip ||
            !flags ||
            !mac ||
            (parseInt(flags, 16) & 0x2) === 0 ||
            !ip.startsWith(`${routerSubnet}.`) ||
            ip.endsWith('.255') ||
            ip === routerHost) {
            return [];
        }
        const octets = mac.split(':');
        if (octets.length !== 6 || octets.some((octet) => !/^[0-9a-f]{1,2}$/i.test(octet))) {
            return [];
        }
        return [
            {
                ip,
                macClean: octets
                    .map((octet) => octet.padStart(2, '0').toUpperCase())
                    .join(':'),
                hostPart: '?',
            },
        ];
    });
}
function parseLinuxNeighborStates(contents, routerSubnet, routerHost) {
    const states = new Map();
    for (const line of contents.split('\n')) {
        const match = line.match(/^((?:\d{1,3}\.){3}\d{1,3})\s+.*\s(REACHABLE|STALE|DELAY|PROBE|FAILED|INCOMPLETE|PERMANENT|NOARP)$/i);
        if (!match)
            continue;
        const [, ip, state] = match;
        if (ip.startsWith(`${routerSubnet}.`) && ip !== routerHost) {
            states.set(ip, state.toUpperCase());
        }
    }
    return states;
}
function getLocalHostDevice(routerSubnet, hostName, interfaces) {
    for (const [interfaceName, addresses] of Object.entries(interfaces)) {
        const address = addresses?.find((candidate) => !candidate.internal &&
            (candidate.family === 'IPv4' || candidate.family === 4) &&
            candidate.address.startsWith(`${routerSubnet}.`));
        if (!address)
            continue;
        return {
            macAddress: address.mac && address.mac !== '00:00:00:00:00:00'
                ? address.mac.toUpperCase()
                : null,
            ipAddress: address.address,
            hostname: hostName || interfaceName,
            deviceType: 'unknown',
            connectionType: 'unknown',
            isOnline: true,
            source: 'local_host',
        };
    }
    return null;
}
let AirtelRouterAdapter = AirtelRouterAdapter_1 = class AirtelRouterAdapter {
    constructor(configService) {
        this.configService = configService;
        this.name = 'airtel';
        this.logger = new common_1.Logger(AirtelRouterAdapter_1.name);
        this.lastSubnetSweep = 0;
    }
    async resolveMdnsHostnames(ips) {
        const results = new Map();
        if (process.platform !== 'linux')
            return results;
        await Promise.all([...new Set(ips)].map(async (ip) => {
            try {
                const { stdout } = await execFileAsync('gdbus', [
                    'call',
                    '--system',
                    '--dest',
                    'org.freedesktop.Avahi',
                    '--object-path',
                    '/',
                    '--method',
                    'org.freedesktop.Avahi.Server.ResolveAddress',
                    'int32 -1',
                    'int32 -1',
                    `'${ip}'`,
                    'uint32 0',
                ], { timeout: 1500 });
                const match = stdout.match(/,\s'((?:[^'\\]|\\.)*)',\s*uint32 \d+\)/);
                const hostname = match?.[1]
                    .replace(/\\([0-7]{3})/g, (_escape, octal) => String.fromCharCode(parseInt(octal, 8)))
                    .replace(/\.local\.?$/i, '');
                if (hostname &&
                    !hostname.toLowerCase().startsWith('unknown_') &&
                    hostname !== ip) {
                    results.set(ip, hostname);
                }
            }
            catch {
            }
        }));
        return results;
    }
    async refreshArpCache(candidateIps) {
        const batchSize = 32;
        for (let i = 0; i < candidateIps.length; i += batchSize) {
            await Promise.allSettled(candidateIps.slice(i, i + batchSize).map((ip) => execFileAsync('ping', ['-c', '1', '-W', '200', ip], {
                timeout: 400,
            })));
        }
    }
    resolveDynamicDeviceDetails(ip, macClean, exposedHost, wifiNames) {
        if (exposedHost &&
            exposedHost !== '?' &&
            !exposedHost.toLowerCase().startsWith('unknown_')) {
            const lower = exposedHost.toLowerCase();
            let deviceType = 'unknown';
            if (lower.includes('ipad') || lower.includes('tablet') || lower.includes('tab'))
                deviceType = 'tablet';
            else if (lower.includes('tv') || lower.includes('box') || lower.includes('stream'))
                deviceType = 'tv';
            else if (lower.includes('macbook') || lower.includes('mac ') || lower.endsWith(' mac') || lower.includes('laptop') || lower.includes('notebook'))
                deviceType = 'laptop';
            else if (lower.includes('iphone') || lower.includes('android') || lower.includes('phone') || lower.includes('pixel') || lower.includes('galaxy') || lower.includes('oppo') || lower.includes('vivo') || lower.includes('redmi') || lower.includes('xiaomi') || lower.includes('oneplus'))
                deviceType = 'mobile';
            else if (lower.includes('sensor') || lower.includes('plug') || lower.includes('iot'))
                deviceType = 'iot';
            return {
                deviceName: exposedHost,
                deviceType,
            };
        }
        const mdnsHostname = wifiNames?.get(ip);
        if (mdnsHostname) {
            return this.resolveDynamicDeviceDetails(ip, macClean, mdnsHostname);
        }
        return {
            deviceName: `Device (${ip})`,
            deviceType: 'unknown',
        };
    }
    isAllowedTargetUrl(rawUrl) {
        try {
            const parsed = new URL(rawUrl);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return false;
            }
            const host = parsed.hostname;
            const isPrivateIpv4 = /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|127\.0\.0\.1|localhost)$/.test(host);
            return isPrivateIpv4;
        }
        catch {
            return false;
        }
    }
    async probeRouterEndpoint(urlStr, timeoutMs = 3000) {
        return new Promise((resolve) => {
            const parsed = new URL(urlStr);
            const isHttps = parsed.protocol === 'https:';
            const client = isHttps ? https : http;
            const req = client.request({
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname || '/',
                method: 'HEAD',
                rejectUnauthorized: false,
                timeout: timeoutMs,
            }, (res) => {
                resolve({ statusCode: res.statusCode });
            });
            req.on('timeout', () => {
                req.destroy();
                resolve({});
            });
            req.on('error', () => {
                resolve({});
            });
            req.end();
        });
    }
    async getStatus() {
        const rawUrl = this.configService.get('app.routerBaseUrl') || 'https://192.168.1.1';
        if (!rawUrl || !this.isAllowedTargetUrl(rawUrl)) {
            this.logger.warn(`Airtel router URL invalid or unsafe: '${rawUrl}'`);
            return {
                wanConnected: null,
                routerUptimeSeconds: null,
                status: 'not_configured',
                modelInfo: 'Unknown Airtel Gateway (Target unverified)',
                source: 'airtel_probe',
            };
        }
        try {
            const probe = await this.probeRouterEndpoint(rawUrl, 3000);
            const isReachable = probe.statusCode !== undefined && probe.statusCode >= 200 && probe.statusCode < 500;
            if (isReachable) {
                return {
                    wanConnected: null,
                    routerUptimeSeconds: null,
                    status: 'ok',
                    modelInfo: 'Configured router responded to an HTTP probe',
                    source: 'airtel_probe',
                };
            }
            return {
                wanConnected: false,
                routerUptimeSeconds: null,
                status: 'unreachable',
                modelInfo: 'Airtel Gateway unreachable at configured IP',
                source: 'airtel_probe',
            };
        }
        catch (err) {
            this.logger.debug(`Airtel router probe failed: ${err.message}`);
            return {
                wanConnected: null,
                routerUptimeSeconds: null,
                status: 'unreachable',
                modelInfo: 'Airtel Gateway unreachable or offline',
                source: 'airtel_probe',
            };
        }
    }
    async getConnectedDevices() {
        const discoveredDevices = [];
        try {
            const routerHost = new URL(this.configService.get('app.routerBaseUrl') ||
                'http://192.168.1.1').hostname;
            const routerSubnet = routerHost.split('.').slice(0, 3).join('.');
            const localHost = getLocalHostDevice(routerSubnet, os.hostname(), os.networkInterfaces());
            if (localHost) {
                discoveredDevices.push(localHost);
            }
            const nowTs = Date.now();
            if (nowTs - this.lastSubnetSweep > 60000) {
                this.lastSubnetSweep = nowTs;
                const candidateIps = Array.from({ length: 253 }, (_, i) => i + 2)
                    .filter((lastOctet) => `${routerSubnet}.${lastOctet}` !== routerHost)
                    .map((lastOctet) => `${routerSubnet}.${lastOctet}`);
                await this.refreshArpCache(candidateIps).catch((err) => {
                    this.logger.warn(`Could not refresh local ARP cache: ${err.message}`);
                });
            }
            const arpCandidates = [];
            if (process.platform === 'linux') {
                const [arpContents, neighborOutput] = await Promise.all([
                    (0, promises_1.readFile)('/proc/net/arp', 'utf8'),
                    execFileAsync('ip', ['neigh', 'show'], { timeout: 3000 }).then(({ stdout }) => stdout, (err) => {
                        this.logger.warn(`Could not read Linux neighbor states: ${err.message}`);
                        return '';
                    }),
                ]);
                const neighborStates = parseLinuxNeighborStates(neighborOutput, routerSubnet, routerHost);
                arpCandidates.push(...parseLinuxArpTable(arpContents, routerSubnet, routerHost).filter(({ ip }) => neighborStates.get(ip) !== 'FAILED' &&
                    neighborStates.get(ip) !== 'INCOMPLETE'));
            }
            else {
                const lines = (await execFileAsync('arp', ['-a'], { timeout: 3000 })).stdout.split('\n');
                for (const line of lines) {
                    const ipMatch = line.match(/\(((?:\d{1,3}\.){3}\d{1,3})\)/);
                    const macMatch = line.match(/at\s+([0-9a-fA-F:]+)/);
                    if (!ipMatch || !macMatch || line.includes('(incomplete)'))
                        continue;
                    const ip = ipMatch[1];
                    const octets = macMatch[1].split(':');
                    if (!ip.startsWith(`${routerSubnet}.`) ||
                        ip.endsWith('.255') ||
                        ip === routerHost ||
                        octets.length !== 6) {
                        continue;
                    }
                    arpCandidates.push({
                        ip,
                        macClean: octets
                            .map((octet) => octet.padStart(2, '0').toUpperCase())
                            .join(':'),
                        hostPart: line.split('(')[0]?.trim() || '?',
                    });
                }
            }
            const wifiNames = await this.resolveMdnsHostnames(arpCandidates.map(({ ip }) => ip));
            for (const { ip, macClean, hostPart } of arpCandidates) {
                const isOnline = true;
                const { deviceName, deviceType } = this.resolveDynamicDeviceDetails(ip, macClean, hostPart, wifiNames);
                discoveredDevices.push({
                    macAddress: macClean,
                    ipAddress: ip,
                    hostname: deviceName,
                    deviceType,
                    connectionType: 'unknown',
                    isOnline,
                    source: 'airtel_arp',
                });
            }
        }
        catch (err) {
            this.logger.warn(`Could not read local network devices: ${err.message}`);
        }
        return discoveredDevices;
    }
    async getInterfaceCounters() {
        return null;
    }
};
exports.AirtelRouterAdapter = AirtelRouterAdapter;
exports.AirtelRouterAdapter = AirtelRouterAdapter = AirtelRouterAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AirtelRouterAdapter);
//# sourceMappingURL=airtel.adapter.js.map