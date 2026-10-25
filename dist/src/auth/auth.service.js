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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const drizzle_orm_1 = require("drizzle-orm");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
let AuthService = AuthService_1 = class AuthService {
    constructor(db, jwtService, configService) {
        this.db = db;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async onModuleInit() {
        await this.ensureInitialAdmin();
    }
    async ensureInitialAdmin() {
        try {
            const existing = await this.db.select().from(schema_1.users).limit(1);
            if (existing.length === 0) {
                const username = this.configService.get('app.initialAdminUsername') || 'admin';
                const rawPassword = this.configService.get('app.initialAdminPassword') ||
                    'HomeNetSecurePass123!';
                const salt = await bcrypt.genSalt(12);
                const passwordHash = await bcrypt.hash(rawPassword, salt);
                await this.db.insert(schema_1.users).values({
                    username,
                    passwordHash,
                    role: 'admin',
                });
                this.logger.log(`Initialized default administrator account: '${username}'`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to ensure initial admin: ${error.message}`);
        }
    }
    async login(dto) {
        const [user] = await this.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.username, dto.username.trim()))
            .limit(1);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            tokenType: 'Bearer',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        };
    }
    async validateUserById(userId) {
        const [user] = await this.db
            .select({
            id: schema_1.users.id,
            username: schema_1.users.username,
            role: schema_1.users.role,
            createdAt: schema_1.users.createdAt,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
    async changePassword(userId, dto) {
        const [user] = await this.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password does not match');
        }
        const salt = await bcrypt.genSalt(12);
        const newHash = await bcrypt.hash(dto.newPassword, salt);
        await this.db
            .update(schema_1.users)
            .set({
            passwordHash: newHash,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return { success: true, message: 'Password updated successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map