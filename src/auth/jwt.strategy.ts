import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret =
      configService.get<string>('app.jwtSecret') ||
      process.env.JWT_SECRET ||
      'homenet_super_secure_jwt_secret_development_only_change_in_production_min32chars';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
