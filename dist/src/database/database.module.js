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
var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const database_provider_1 = require("./database.provider");
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    constructor(pool) {
        this.pool = pool;
        this.logger = new common_1.Logger(DatabaseModule_1.name);
    }
    async onApplicationShutdown(signal) {
        this.logger.log(`Closing PostgreSQL connection pool on ${signal || 'shutdown'}...`);
        await this.pool.end();
        this.logger.log('PostgreSQL connection pool closed.');
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = DatabaseModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [...database_provider_1.databaseProviders],
        exports: [database_provider_1.PG_POOL, database_provider_1.DRIZZLE_ORM],
    }),
    __param(0, (0, common_1.Inject)(database_provider_1.PG_POOL)),
    __metadata("design:paramtypes", [pg_1.Pool])
], DatabaseModule);
//# sourceMappingURL=database.module.js.map