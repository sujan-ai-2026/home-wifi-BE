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
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const cors_1 = require("../config/cors");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor() {
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
    }
    handleConnection(client) {
        this.logger.log(`Client connected to WebSocket: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from WebSocket: ${client.id}`);
    }
    handlePing(client) {
        client.emit('pong', { timestamp: new Date().toISOString() });
    }
    broadcast(event, data) {
        if (this.server) {
            this.server.emit(event, data);
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handlePing", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = (0, cors_1.getAllowedOrigins)(process.env.FRONTEND_ORIGIN);
                const nodeEnv = process.env.NODE_ENV || 'development';
                callback(null, (0, cors_1.isCorsOriginAllowed)(origin, allowedOrigins, nodeEnv));
            },
            credentials: true,
        },
    })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map