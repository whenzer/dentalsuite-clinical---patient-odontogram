import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    sub: string;
    email: string;
    username: string;
    role: 'admin' | 'dentist' | 'receptionist';
  };
}

@Injectable()
export class TokenValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TokenValidationMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip token check for public paths: auth register, login, refresh, health docs
    const publicPaths = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/health',
      '/api/docs',
    ];

    const isPublic = publicPaths.some((p) => req.originalUrl.startsWith(p));
    if (isPublic) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // Allow request to proceed if optional or let JwtAuthGuard handle rejection
      return next();
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Malformed Authorization header. Format: Bearer <token>');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET', 'super_secret_clinical_access_jwt_key_32chars_min_replace_in_prod!');
      const payload = this.jwtService.verify(token, { secret });

      // Verify token is not expired (payload.exp is in seconds)
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSeconds) {
        throw new UnauthorizedException('Access token has expired (15 min validity). Please use refresh token.');
      }

      req.user = {
        id: payload.sub,
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      };

      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token has expired. Use /api/v1/auth/refresh to renew.');
      }
      throw new UnauthorizedException(`Token validation failed: ${err.message}`);
    }
  }
}
