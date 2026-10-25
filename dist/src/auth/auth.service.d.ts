import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DrizzleDb } from '../database/database.provider';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthService implements OnModuleInit {
    private readonly db;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(db: DrizzleDb, jwtService: JwtService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    ensureInitialAdmin(): Promise<void>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        tokenType: string;
        user: {
            id: string;
            username: string;
            role: string;
        };
    }>;
    validateUserById(userId: string): Promise<{
        id: string;
        username: string;
        role: string;
        createdAt: Date;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
