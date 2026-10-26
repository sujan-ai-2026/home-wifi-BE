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
var CliSpeedTestProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliSpeedTestProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
let CliSpeedTestProvider = CliSpeedTestProvider_1 = class CliSpeedTestProvider {
    constructor(configService) {
        this.configService = configService;
        this.name = 'cli';
        this.logger = new common_1.Logger(CliSpeedTestProvider_1.name);
    }
    async execute() {
        const bin = this.configService.get('app.speedtestBin') || 'speedtest';
        const now = new Date();
        try {
            this.logger.log(`Executing Ookla Speedtest binary: '${bin}'`);
            const { stdout } = await execFileAsync(bin, ['--format=json', '--accept-license', '--accept-gdpr'], {
                timeout: 60000,
                maxBuffer: 1024 * 1024,
            });
            const parsed = JSON.parse(stdout);
            const downloadMbps = parsed.download?.bandwidth
                ? (parsed.download.bandwidth * 8) / 1000000
                : null;
            const uploadMbps = parsed.upload?.bandwidth
                ? (parsed.upload.bandwidth * 8) / 1000000
                : null;
            const latencyMs = parsed.ping?.latency ?? null;
            const jitterMs = parsed.ping?.jitter ?? null;
            const serverName = parsed.server?.name ?? 'Unknown Server';
            return {
                status: 'success',
                downloadMbps: downloadMbps ? parseFloat(downloadMbps.toFixed(2)) : null,
                uploadMbps: uploadMbps ? parseFloat(uploadMbps.toFixed(2)) : null,
                latencyMs: latencyMs ? parseFloat(latencyMs.toFixed(2)) : null,
                jitterMs: jitterMs ? parseFloat(jitterMs.toFixed(2)) : null,
                serverName,
                provider: 'ookla_cli',
                measuredAt: now,
            };
        }
        catch (err) {
            this.logger.error(`Speedtest CLI execution failed: ${err.message}`);
            const sanitizedError = (err.stderr || err.message || 'CLI execution error')
                .replace(/[\r\n]+/g, ' ')
                .substring(0, 300);
            return {
                status: 'failed',
                downloadMbps: null,
                uploadMbps: null,
                latencyMs: null,
                jitterMs: null,
                serverName: null,
                provider: 'ookla_cli',
                errorCode: err.code === 'ENOENT'
                    ? 'SPEEDTEST_NOT_INSTALLED'
                    : err.code || 'EXEC_FAIL',
                errorMessage: sanitizedError,
                measuredAt: now,
            };
        }
    }
};
exports.CliSpeedTestProvider = CliSpeedTestProvider;
exports.CliSpeedTestProvider = CliSpeedTestProvider = CliSpeedTestProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CliSpeedTestProvider);
//# sourceMappingURL=cli-speed-test.provider.js.map