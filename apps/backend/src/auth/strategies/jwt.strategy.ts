import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email?: string;
  typ?: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const s = config.get<string>('JWT_SECRET');
        if (!s) {
          throw new Error('Missing JWT_SECRET');
        }
        return s;
      })(),
    });
  }

  validate(payload: JwtPayload): { userId: string; email?: string } {
    return { userId: payload.sub, email: payload.email };
  }
}
