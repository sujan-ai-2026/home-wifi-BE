"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationIdInterceptor = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let CorrelationIdInterceptor = class CorrelationIdInterceptor {
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
        req.headers['x-correlation-id'] = correlationId;
        res.setHeader('x-correlation-id', correlationId);
        return next.handle();
    }
};
exports.CorrelationIdInterceptor = CorrelationIdInterceptor;
exports.CorrelationIdInterceptor = CorrelationIdInterceptor = __decorate([
    (0, common_1.Injectable)()
], CorrelationIdInterceptor);
//# sourceMappingURL=correlation-id.interceptor.js.map