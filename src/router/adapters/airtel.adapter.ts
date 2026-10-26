import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';
import * as os from 'os';
import { execFile } from 'child_process';
import { readFile } from 'fs/promises';
import { promisify } from 'util';
import {
  RouterAdapter,
  RouterStatusResult,
  RouterDevice,
  InterfaceCountersResult,
} from './router.adapter.interface';

const execFileAsync = promisify(execFile);

export function parseLinuxArpTable(
  contents: string,
  routerSubnet: string,
  routerHost: string,
): Array<{ ip: string; macClean: string; hostPart: string }> {
  return contents
    .split('\n')
    .slice(1)
    .flatMap((line) => {
      const [ip, , flags, mac] = line.trim().split(/\s+/);
      if (
        !ip ||
        !flags ||
        !mac ||
        (parseInt(flags, 16) & 0x2) === 0 ||
        !ip.startsWith(`${routerSubnet}.`) ||
        ip.endsWith('.255') ||
        ip === routerHost
      ) {
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

export function parseLinuxNeighborStates(
  contents: string,
  routerSubnet: string,
  routerHost: string,
): Map<string, string> {
  const states = new Map<string, string>();
  for (const line of contents.split('\n')) {
    const match = line.match(
      /^((?:\d{1,3}\.){3}\d{1,3})\s+.*\s(REACHABLE|STALE|DELAY|PROBE|FAILED|INCOMPLETE|PERMANENT|NOARP)$/i,
    );
    if (!match) continue;

    const [, ip, state] = match;
    if (ip.startsWith(`${routerSubnet}.`) && ip !== routerHost) {
      states.set(ip, state.toUpperCase());
    }
  }
  return states;
}

export function getLocalHostDevice(
  routerSubnet: string,
  hostName: string,
  interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>,
): RouterDevice | null {
  for (const [interfaceName, addresses] of Object.entries(interfaces)) {
    const address = addresses?.find(
      (candidate) =>
        !candidate.internal &&
        (candidate.family === 'IPv4' || (candidate.family as any) === 4) &&
        candidate.address.startsWith(`${routerSubnet}.`),
    );
    if (!address) continue;

    return {
      macAddress:
        address.mac && address.mac !== '00:00:00:00:00:00'
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

@Injectable()
export class AirtelRouterAdapter implements RouterAdapter {
  readonly name = 'airtel';
  private readonly logger = new Logger(AirtelRouterAdapter.name);
  private lastSubnetSweep = 0;

  constructor(private readonly configService: ConfigService) {}

  private async resolveMdnsHostnames(ips: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    if (process.platform !== 'linux') return results;

    await Promise.all(
      [...new Set(ips)].map(async (ip) => {
        try {
          const { stdout } = await execFileAsync(
            'gdbus',
            [
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
            ],
            { timeout: 1500 },
          );
          const match = stdout.match(/,\s'((?:[^'\\]|\\.)*)',\s*uint32 \d+\)/);
          const hostname = match?.[1]
            .replace(/\\([0-7]{3})/g, (_escape, octal: string) =>
              String.fromCharCode(parseInt(octal, 8)),
            )
            .replace(/\.local\.?$/i, '');

          if (
            hostname &&
            !hostname.toLowerCase().startsWith('unknown_') &&
            hostname !== ip
          ) {
            results.set(ip, hostname);
          }
        } catch {
          // Keep ARP-provided names when Avahi is unavailable or has no hostname.
        }
      }),
    );

    return results;
  }

  private async refreshArpCache(candidateIps: string[]): Promise<void> {
    const batchSize = 32;
    for (let i = 0; i < candidateIps.length; i += batchSize) {
      await Promise.allSettled(
        candidateIps.slice(i, i + batchSize).map((ip) =>
          execFileAsync('ping', ['-c', '1', '-W', '200', ip], {
            timeout: 400,
          }),
        ),
      );
    }
  }

  /**
   * Uses hostnames advertised on the LAN; randomized MAC addresses do not identify device models.
   */
  private resolveDynamicDeviceDetails(
    ip: string,
    macClean: string,
    exposedHost?: string,
    wifiNames?: Map<string, string>,
  ): { deviceName: string; deviceType: string } {
    // 1. If router / ARP table literally exposes a valid hostname (not "?" or "unknown_...")
    if (
      exposedHost &&
      exposedHost !== '?' &&
      !exposedHost.toLowerCase().startsWith('unknown_')
    ) {
      const lower = exposedHost.toLowerCase();
      let deviceType = 'unknown';
      if (lower.includes('ipad') || lower.includes('tablet') || lower.includes('tab')) deviceType = 'tablet';
      else if (lower.includes('tv') || lower.includes('box') || lower.includes('stream')) deviceType = 'tv';
      else if (lower.includes('macbook') || lower.includes('mac ') || lower.endsWith(' mac') || lower.includes('laptop') || lower.includes('notebook')) deviceType = 'laptop';
      else if (lower.includes('iphone') || lower.includes('android') || lower.includes('phone') || lower.includes('pixel') || lower.includes('galaxy') || lower.includes('oppo') || lower.includes('vivo') || lower.includes('redmi') || lower.includes('xiaomi') || lower.includes('oneplus')) deviceType = 'mobile';
      else if (lower.includes('sensor') || lower.includes('plug') || lower.includes('iot')) deviceType = 'iot';

      return {
        deviceName: exposedHost,
        deviceType,
      };
    }

    // Prefer the hostname Avahi resolves for this specific LAN address.
    const mdnsHostname = wifiNames?.get(ip);
    if (mdnsHostname) {
      return this.resolveDynamicDeviceDetails(ip, macClean, mdnsHostname);
    }

    // A randomized MAC does not identify whether a device is a phone, tablet, or laptop.
    return {
      deviceName: `Device (${ip})`,
      deviceType: 'unknown',
    };
  }

  /**
   * Safe SSRF validation for router target base URL
   */
  private isAllowedTargetUrl(rawUrl: string): boolean {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      const host = parsed.hostname;
      const isPrivateIpv4 =
        /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|127\.0\.0\.1|localhost)$/.test(
          host,
        );
      return isPrivateIpv4;
    } catch {
      return false;
    }
  }

  /**
   * Direct probe to local router endpoint with support for self-signed certificates on private IPs
   */
  private async probeRouterEndpoint(urlStr: string, timeoutMs = 3000): Promise<{ statusCode?: number }> {
    return new Promise((resolve) => {
      const parsed = new URL(urlStr);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname || '/',
          method: 'HEAD',
          rejectUnauthorized: false, // Home gateways use self-signed certs
          timeout: timeoutMs,
        },
        (res) => {
          resolve({ statusCode: res.statusCode });
        },
      );

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

  async getStatus(): Promise<RouterStatusResult> {
    const rawUrl = this.configService.get<string>('app.routerBaseUrl') || 'https://192.168.1.1';
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
    } catch (err: any) {
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

  async getConnectedDevices(): Promise<RouterDevice[]> {
    const discoveredDevices: RouterDevice[] = [];

    try {
      const routerHost = new URL(
        this.configService.get<string>('app.routerBaseUrl') ||
          'http://192.168.1.1',
      ).hostname;
      const routerSubnet = routerHost.split('.').slice(0, 3).join('.');
      const localHost = getLocalHostDevice(
        routerSubnet,
        os.hostname(),
        os.networkInterfaces(),
      );
      if (localHost) {
        discoveredDevices.push(localHost);
      }

      // Refresh ARP before reading it so newly connected clients are visible in this poll.
      const nowTs = Date.now();
      if (nowTs - this.lastSubnetSweep > 60000) {
        this.lastSubnetSweep = nowTs;
        const candidateIps = Array.from({ length: 253 }, (_, i) => i + 2)
          .filter((lastOctet) => `${routerSubnet}.${lastOctet}` !== routerHost)
          .map((lastOctet) => `${routerSubnet}.${lastOctet}`);
        await this.refreshArpCache(candidateIps).catch((err: Error) => {
          this.logger.warn(`Could not refresh local ARP cache: ${err.message}`);
        });
      }

      const arpCandidates: Array<{
        ip: string;
        macClean: string;
        hostPart: string;
      }> = [];

      if (process.platform === 'linux') {
        const [arpContents, neighborOutput] = await Promise.all([
          readFile('/proc/net/arp', 'utf8'),
          execFileAsync('ip', ['neigh', 'show'], { timeout: 3000 }).then(
            ({ stdout }) => stdout,
            (err: Error) => {
              this.logger.warn(
                `Could not read Linux neighbor states: ${err.message}`,
              );
              return '';
            },
          ),
        ]);
        const neighborStates = parseLinuxNeighborStates(
          neighborOutput,
          routerSubnet,
          routerHost,
        );
        arpCandidates.push(
          ...parseLinuxArpTable(arpContents, routerSubnet, routerHost).filter(
            ({ ip }) =>
              neighborStates.get(ip) !== 'FAILED' &&
              neighborStates.get(ip) !== 'INCOMPLETE',
          ),
        );
      } else {
        const lines = (
          await execFileAsync('arp', ['-a'], { timeout: 3000 })
        ).stdout.split('\n');
        for (const line of lines) {
          const ipMatch = line.match(/\(((?:\d{1,3}\.){3}\d{1,3})\)/);
          const macMatch = line.match(/at\s+([0-9a-fA-F:]+)/);
          if (!ipMatch || !macMatch || line.includes('(incomplete)')) continue;

          const ip = ipMatch[1];
          const octets = macMatch[1].split(':');
          if (
            !ip.startsWith(`${routerSubnet}.`) ||
            ip.endsWith('.255') ||
            ip === routerHost ||
            octets.length !== 6
          ) {
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

      const wifiNames = await this.resolveMdnsHostnames(
        arpCandidates.map(({ ip }) => ip),
      );

      for (const { ip, macClean, hostPart } of arpCandidates) {
        // A complete ARP entry proves the client is present on the LAN; many clients block ICMP.
        const isOnline = true;
        // Dynamically determine device name and type based on router Wi-Fi and network details
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
    } catch (err: any) {
      this.logger.warn(`Could not read local network devices: ${err.message}`);
    }

    return discoveredDevices;
  }

  async getInterfaceCounters(): Promise<InterfaceCountersResult | null> {
    return null;
  }
}
