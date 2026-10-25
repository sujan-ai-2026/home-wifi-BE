"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockRouterAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRouterAdapter = void 0;
const common_1 = require("@nestjs/common");
let MockRouterAdapter = MockRouterAdapter_1 = class MockRouterAdapter {
    constructor() {
        this.name = 'mock';
        this.logger = new common_1.Logger(MockRouterAdapter_1.name);
        this.startTime = Date.now() - 3600 * 24 * 5 * 1000;
    }
    async getStatus() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        return {
            wanConnected: true,
            routerUptimeSeconds: uptime,
            status: 'ok',
            modelInfo: 'HomeNet Mock Fiber Gateway (Simulated)',
            source: 'mock',
        };
    }
    async getConnectedDevices() {
        return [
            {
                macAddress: '3C:22:FB:45:67:89',
                ipAddress: '192.168.1.10',
                hostname: 'MacBook-Pro.local',
                deviceType: 'laptop',
                connectionType: 'wifi',
                isOnline: true,
                source: 'mock_dhcp',
            },
            {
                macAddress: 'F0:18:98:12:34:56',
                ipAddress: '192.168.1.15',
                hostname: 'iPhone-15.local',
                deviceType: 'mobile',
                connectionType: 'wifi',
                isOnline: true,
                source: 'mock_dhcp',
            },
            {
                macAddress: 'B8:27:EB:AA:BB:CC',
                ipAddress: '192.168.1.20',
                hostname: 'HomeAssistant.lan',
                deviceType: 'server',
                connectionType: 'ethernet',
                isOnline: true,
                source: 'mock_arp',
            },
            {
                macAddress: 'DC:A6:32:98:76:54',
                ipAddress: '192.168.1.25',
                hostname: 'LG-Smart-TV.lan',
                deviceType: 'tv',
                connectionType: 'wifi',
                isOnline: false,
                source: 'mock_dhcp',
            },
        ];
    }
    async getInterfaceCounters() {
        const secondsRunning = Math.floor((Date.now() - this.startTime) / 1000);
        const received = 50000000000 + secondsRunning * 150000;
        const transmitted = 12000000000 + secondsRunning * 40000;
        return {
            receivedBytes: received,
            transmittedBytes: transmitted,
            source: 'mock',
        };
    }
};
exports.MockRouterAdapter = MockRouterAdapter;
exports.MockRouterAdapter = MockRouterAdapter = MockRouterAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], MockRouterAdapter);
//# sourceMappingURL=mock.adapter.js.map