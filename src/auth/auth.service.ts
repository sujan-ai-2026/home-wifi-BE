import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleDb } from '../database/database.provider';
import { users } from '../database/schema';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_ORM) private readonly db: DrizzleDb,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureInitialAdmin();
  }

  /**
   * Ensures at least one admin account exists on initial launch
   */
  async ensureInitialAdmin() {
    try {
      const existing = await this.db.select().from(users).limit(1);
      if (existing.length === 0) {
        const username =
          this.configService.get<string>('app.initialAdminUsername') || 'admin';
        const rawPassword =
          this.configService.get<string>('app.initialAdminPassword') ||
          'HomeNetSecurePass123!';

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

        await this.db.insert(users).values({
          username,
          passwordHash,
          role: 'admin',
        });

        this.logger.log(`Initialized default administrator account: '${username}'`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to ensure initial admin: ${error.message}`);
    }
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, dto.username.trim()))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid username or password');
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

  async validateUserById(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password does not match');
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    await this.db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true, message: 'Password updated successfully' };
  }
}
