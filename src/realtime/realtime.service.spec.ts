import { RealtimeService } from './realtime.service';
import { RouterDevice } from '../router/adapters/router.adapter.interface';

describe('RealtimeService device updates', () => {
  it('broadcasts current router observations in both device update events', () => {
    const gateway = { broadcast: jest.fn() };
    const service = new RealtimeService(gateway as any);
    const devices: RouterDevice[] = [
      {
        macAddress: '00:11:22:33:44:55',
        ipAddress: '192.168.1.20',
        hostname: 'Observed device',
        deviceType: 'unknown',
        connectionType: 'wifi',
        isOnline: true,
        source: 'airtel_arp',
      },
    ];

    service.emitDevices({
      totalConnected: 1,
      updatedAt: '2026-10-25T12:00:00.000Z',
      devices,
    });
    service.emitDevicesListUpdated(devices);

    expect(gateway.broadcast).toHaveBeenNthCalledWith(
      1,
      'devices.updated',
      expect.objectContaining({ totalConnected: 1, devices }),
    );
    expect(gateway.broadcast).toHaveBeenNthCalledWith(
      2,
      'devices.list.updated',
      expect.objectContaining({ devices }),
    );
  });
});
