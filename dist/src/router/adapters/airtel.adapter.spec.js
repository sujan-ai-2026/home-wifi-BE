"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const airtel_adapter_1 = require("./airtel.adapter");
describe('AirtelRouterAdapter', () => {
    let adapter;
    let mockConfigService;
    beforeEach(() => {
        mockConfigService = {
            get: jest.fn(),
        };
        adapter = new airtel_adapter_1.AirtelRouterAdapter(mockConfigService);
    });
    it('finds complete Linux ARP neighbors after the subnet refresh', () => {
        const neighbors = (0, airtel_adapter_1.parseLinuxArpTable)([
            'IP address       HW type     Flags       HW address            Mask     Device',
            '192.168.1.22     0x1         0x2         0a:cc:f4:36:2f:ff     *        wlan0',
            '192.168.1.23     0x1         0x0         00:00:00:00:00:00     *        wlan0',
            '192.168.2.24     0x1         0x2         aa:bb:cc:dd:ee:ff     *        wlan0',
        ].join('\n'), '192.168.1', '192.168.1.1');
        expect(neighbors).toEqual([
            {
                ip: '192.168.1.22',
                macClean: '0A:CC:F4:36:2F:FF',
                hostPart: '?',
            },
        ]);
    });
    it('filters neighbors that have failed active Linux probes', () => {
        const states = (0, airtel_adapter_1.parseLinuxNeighborStates)([
            '192.168.1.22 dev wlo1 lladdr 0a:cc:f4:36:2f:ff REACHABLE',
            '192.168.1.23 dev wlo1 lladdr aa:bb:cc:dd:ee:ff FAILED',
            '192.168.2.24 dev wlo1 lladdr 11:22:33:44:55:66 STALE',
        ].join('\n'), '192.168.1', '192.168.1.1');
        expect(states.get('192.168.1.22')).toBe('REACHABLE');
        expect(states.get('192.168.1.23')).toBe('FAILED');
        expect(states.has('192.168.2.24')).toBe(false);
    });
    it('identifies the backend host on the router subnet by its real hostname', () => {
        expect((0, airtel_adapter_1.getLocalHostDevice)('192.168.1', 'luna-HP-Lap', {
            lo: [
                {
                    address: '127.0.0.1',
                    netmask: '255.0.0.0',
                    family: 'IPv4',
                    mac: '00:00:00:00:00:00',
                    internal: true,
                    cidr: '127.0.0.1/8',
                },
            ],
            wlo1: [
                {
                    address: '192.168.1.5',
                    netmask: '255.255.255.0',
                    family: 'IPv4',
                    mac: 'AA:BB:CC:DD:EE:FF',
                    internal: false,
                    cidr: '192.168.1.5/24',
                },
            ],
            docker0: [
                {
                    address: '172.17.0.1',
                    netmask: '255.255.0.0',
                    family: 'IPv4',
                    mac: '11:22:33:44:55:66',
                    internal: false,
                    cidr: '172.17.0.1/16',
                },
            ],
        })).toMatchObject({
            hostname: 'luna-HP-Lap',
            ipAddress: '192.168.1.5',
            source: 'local_host',
            isOnline: true,
        });
    });
    it('does not identify a host interface outside the router subnet', () => {
        expect((0, airtel_adapter_1.getLocalHostDevice)('192.168.1', 'host', {
            docker0: [
                {
                    address: '172.17.0.1',
                    netmask: '255.255.0.0',
                    family: 'IPv4',
                    mac: '11:22:33:44:55:66',
                    internal: false,
                    cidr: '172.17.0.1/16',
                },
            ],
        })).toBeNull();
    });
    it('should report not_configured when URL is an AWS metadata service SSRF attempt', async () => {
        mockConfigService.get.mockReturnValue('http://169.254.169.254/latest/meta-data/');
        const status = await adapter.getStatus();
        expect(status.status).toBe('not_configured');
        expect(status.wanConnected).toBeNull();
    });
    it('should report not_configured when URL is an arbitrary public internet domain', async () => {
        mockConfigService.get.mockReturnValue('http://evil.com/exploit');
        const status = await adapter.getStatus();
        expect(status.status).toBe('not_configured');
        expect(status.wanConnected).toBeNull();
    });
    it('should identify an iPad from its hostname', () => {
        const details = adapter.resolveDynamicDeviceDetails('192.168.1.22', '0A:CC:F4:36:2F:FF', 'iPad');
        expect(details).toEqual({ deviceName: 'iPad', deviceType: 'tablet' });
    });
    it('uses an Avahi hostname for the matching LAN address', () => {
        const details = adapter.resolveDynamicDeviceDetails('192.168.1.22', '0A:CC:F4:36:2F:FF', '?', new Map([['192.168.1.22', 'Sujan MacBook']]));
        expect(details).toEqual({
            deviceName: 'Sujan MacBook',
            deviceType: 'laptop',
        });
    });
    it('should not classify an unidentified randomized MAC as a smartphone', () => {
        const details = adapter.resolveDynamicDeviceDetails('192.168.1.22', '0A:CC:F4:36:2F:FF', '?');
        expect(details).toEqual({
            deviceName: 'Device (192.168.1.22)',
            deviceType: 'unknown',
        });
    });
    it('does not return estimated interface counters', async () => {
        const counters = await adapter.getInterfaceCounters();
        expect(counters).toBeNull();
    });
    it('does not infer WAN status or uptime from router reachability', async () => {
        mockConfigService.get.mockReturnValue('http://169.254.169.254');
        const status = await adapter.getStatus();
        expect(status.wanConnected).toBeNull();
        expect(status.routerUptimeSeconds).toBeNull();
    });
});
//# sourceMappingURL=airtel.adapter.spec.js.map