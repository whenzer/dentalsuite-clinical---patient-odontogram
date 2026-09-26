import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserEntity } from '../users/entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Hashes a raw refresh token using SHA-256 for secure database persistence
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a 15-minute Access Token
   */
  private generateAccessToken(user: UserEntity): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'super_secret_clinical_access_jwt_key_32chars_min_replace_in_prod!',
      ),
      expiresIn: '15m', // 15-minute access token as requested
    });
  }

  /**
   * Generates a 7-day Refresh Token, saves hashed version in database, returns raw token
   */
  private async createAndSaveRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    // 7-day expiration from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = this.refreshTokensRepository.create({
      userId,
      tokenHash,
      expiresAt,
      isRevoked: false,
      ipAddress,
      userAgent,
    });

    await this.refreshTokensRepository.save(refreshTokenEntity);
    return rawToken;
  }

  /**
   * Register a new clinical user
   */
  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: Omit<UserEntity, 'passwordHash' | 'refreshTokens'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // 1. Password confirmation check
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // 2. Check if email or username already exists
    const existingEmail = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new ConflictException('An account with this email address already exists');
    }

    const existingUsername = await this.usersRepository.findOne({
      where: { username: dto.username.toLowerCase().trim() },
    });
    if (existingUsername) {
      throw new ConflictException('An account with this username already exists');
    }

    // 3. Bcrypt password hashing (salt rounds from config or 10)
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
      10,
    );
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 4. Create and save new user entity
    const newUser = this.usersRepository.create({
      email: dto.email.toLowerCase().trim(),
      username: dto.username.toLowerCase().trim(),
      name: dto.name.trim(),
      passwordHash,
      role: dto.role || 'dentist',
      title: dto.title || 'Dental Practitioner',
      avatarUrl: dto.avatarUrl,
    });

    const savedUser = await this.usersRepository.save(newUser);
    this.logger.log(`New user registered: ${savedUser.username} (${savedUser.email})`);

    // 5. Generate 15-minute access token and 7-day refresh token
    const accessToken = this.generateAccessToken(savedUser);
    const refreshToken = await this.createAndSaveRefreshToken(
      savedUser.id,
      ipAddress,
      userAgent,
    );

    // Sanitize user before returning
    const { passwordHash: _, refreshTokens: __, ...userProfile } = savedUser;

    return {
      user: userProfile,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * User login with 15m JWT + 7d Refresh Token in database
   */
  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: Omit<UserEntity, 'passwordHash' | 'refreshTokens'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const identifier = dto.usernameOrEmail.toLowerCase().trim();

    // Find user by either email or username with passwordHash selected
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :identifier OR LOWER(user.username) = :identifier', {
        identifier,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    // Verify bcrypt password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    // Generate 15-minute access token and 7-day refresh token
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createAndSaveRefreshToken(
      user.id,
      ipAddress,
      userAgent,
    );

    // Clean up expired tokens asynchronously
    this.purgeExpiredTokens(user.id).catch((err) =>
      this.logger.warn(`Failed to purge expired tokens for user ${user.id}: ${err.message}`),
    );

    const { passwordHash: _, refreshTokens: __, ...userProfile } = user;

    return {
      user: userProfile,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Refresh token rotation:
   * Validates 7-day refresh token from DB. If valid, issues new 15m token and rotates refresh token.
   */
  async refreshToken(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: Omit<UserEntity, 'passwordHash' | 'refreshTokens'>;
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const existingRecord = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!existingRecord) {
      throw new UnauthorizedException('Invalid or unknown refresh token. Please log in again.');
    }

    // If token has been revoked, detect potential reuse attack!
    if (existingRecord.isRevoked) {
      this.logger.warn(
        `Revoked refresh token reuse attempted by user ${existingRecord.userId}. Revoking all tokens.`,
      );
      // Security standard: revoke all tokens for this user on suspicious reuse
      await this.refreshTokensRepository.update(
        { userId: existingRecord.userId },
        { isRevoked: true },
      );
      throw new UnauthorizedException(
        'Security alert: Token reuse detected. All sessions revoked. Please log in again.',
      );
    }

    // Check if token has passed its 7-day expiration
    if (new Date() > existingRecord.expiresAt) {
      await this.refreshTokensRepository.update(existingRecord.id, { isRevoked: true });
      throw new UnauthorizedException(
        'Refresh token has expired (exceeded 7 days). Please log in again.',
      );
    }

    const user = existingRecord.user;
    if (!user) {
      throw new UnauthorizedException('Associated user no longer exists.');
    }

    // Revoke the used refresh token and issue a new rotated one
    await this.refreshTokensRepository.update(existingRecord.id, {
      isRevoked: true,
    });

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.createAndSaveRefreshToken(
      user.id,
      ipAddress,
      userAgent,
    );

    const { passwordHash: _, refreshTokens: __, ...userProfile } = user;

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      user: userProfile,
    };
  }

  /**
   * Log out: Revoke the given refresh token or all user refresh tokens
   */
  async logout(rawRefreshToken?: string, userId?: string): Promise<{ success: boolean; message: string }> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.refreshTokensRepository.update({ tokenHash }, { isRevoked: true });
    } else if (userId) {
      await this.refreshTokensRepository.update({ userId }, { isRevoked: true });
    }

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Purges expired and revoked tokens older than 7 days to keep database lean
   */
  async purgeExpiredTokens(userId?: string): Promise<void> {
    const now = new Date();
    const criteria: any = { expiresAt: LessThan(now) };
    if (userId) {
      criteria.userId = userId;
    }
    await this.refreshTokensRepository.delete(criteria);
  }
}
