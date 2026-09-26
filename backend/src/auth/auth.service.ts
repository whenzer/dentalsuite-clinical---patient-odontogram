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
import { ClinicEntity } from '../clinics/entities/clinic.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterClinicDto, LoginClinicDto, LoginStaffDto } from './dto/clinic-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ClinicEntity)
    private readonly clinicsRepository: Repository<ClinicEntity>,
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
   * Generates a 15-minute Access Token for Clinic Account
   */
  private generateClinicAccessToken(clinic: ClinicEntity): string {
    const payload = {
      sub: clinic.id,
      clinicId: clinic.id,
      email: clinic.email,
      name: clinic.name,
      role: 'clinic_admin',
      type: 'clinic',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'super_secret_clinical_access_jwt_key_32chars_min_replace_in_prod!',
      ),
      expiresIn: '15m',
    });
  }

  /**
   * Generates a 15-minute Access Token for Staff Account
   */
  private generateStaffAccessToken(user: UserEntity): string {
    const payload = {
      sub: user.id,
      userId: user.id,
      clinicId: user.clinicId,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      title: user.title,
      permissions: user.permissions || [],
      type: 'staff',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'super_secret_clinical_access_jwt_key_32chars_min_replace_in_prod!',
      ),
      expiresIn: '15m',
    });
  }

  /**
   * Generates a 7-day Refresh Token, saves hashed version in database, returns raw token
   */
  private async createAndSaveRefreshToken(
    identifier: { userId?: string; clinicId?: string; accountType: 'staff' | 'clinic' },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    // 7-day expiration from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = this.refreshTokensRepository.create({
      userId: identifier.userId,
      clinicId: identifier.clinicId,
      accountType: identifier.accountType,
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
   * Register a new Clinic account
   */
  async registerClinic(
    dto: RegisterClinicDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    clinic: Omit<ClinicEntity, 'passwordHash' | 'staff'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    accountType: 'clinic';
  }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const email = dto.email.toLowerCase().trim();
    const existingClinic = await this.clinicsRepository.findOne({
      where: { email },
    });
    if (existingClinic) {
      throw new ConflictException('A clinic account with this email address already exists');
    }

    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
      10,
    );
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const newClinic = this.clinicsRepository.create({
      name: dto.clinicName.trim(),
      email,
      passwordHash,
      phone: dto.phone?.trim(),
      address: dto.address?.trim(),
      registrationNumber: dto.registrationNumber?.trim(),
      ownerName: dto.ownerName?.trim(),
    });

    const savedClinic = await this.clinicsRepository.save(newClinic);
    this.logger.log(`New clinic registered: ${savedClinic.name} (${savedClinic.email})`);

    const accessToken = this.generateClinicAccessToken(savedClinic);
    const refreshToken = await this.createAndSaveRefreshToken(
      { clinicId: savedClinic.id, accountType: 'clinic' },
      ipAddress,
      userAgent,
    );

    const { passwordHash: _, staff: __, ...clinicProfile } = savedClinic;

    return {
      clinic: clinicProfile,
      accessToken,
      refreshToken,
      expiresIn: 900,
      accountType: 'clinic',
    };
  }

  /**
   * Login as Clinic Account
   */
  async loginClinic(
    dto: LoginClinicDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    clinic: Omit<ClinicEntity, 'passwordHash' | 'staff'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    accountType: 'clinic';
  }> {
    const email = dto.email.toLowerCase().trim();

    const clinic = await this.clinicsRepository
      .createQueryBuilder('clinic')
      .addSelect('clinic.passwordHash')
      .where('LOWER(clinic.email) = :email', { email })
      .getOne();

    if (!clinic) {
      throw new UnauthorizedException('Invalid clinic email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, clinic.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid clinic email or password');
    }

    const accessToken = this.generateClinicAccessToken(clinic);
    const refreshToken = await this.createAndSaveRefreshToken(
      { clinicId: clinic.id, accountType: 'clinic' },
      ipAddress,
      userAgent,
    );

    const { passwordHash: _, staff: __, ...clinicProfile } = clinic;

    return {
      clinic: clinicProfile,
      accessToken,
      refreshToken,
      expiresIn: 900,
      accountType: 'clinic',
    };
  }

  /**
   * Login as Staff Account
   */
  async loginStaff(
    dto: LoginStaffDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: Omit<UserEntity, 'passwordHash' | 'refreshTokens'> & { clinicName?: string };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    accountType: 'staff';
  }> {
    const identifier = dto.usernameOrEmail.toLowerCase().trim();

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.clinic', 'clinic')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :identifier OR LOWER(user.username) = :identifier', {
        identifier,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid staff username/email or password');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException(
        'This staff account has been set to inactive by your Clinic Administrator. Please contact management.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid staff username/email or password');
    }

    const accessToken = this.generateStaffAccessToken(user);
    const refreshToken = await this.createAndSaveRefreshToken(
      { userId: user.id, clinicId: user.clinicId, accountType: 'staff' },
      ipAddress,
      userAgent,
    );

    const { passwordHash: _, refreshTokens: __, clinic, ...userProfile } = user;

    return {
      user: {
        ...userProfile,
        clinicName: clinic?.name,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
      accountType: 'staff',
    };
  }

  /**
   * Universal Login (Supports both staff and clinic)
   */
  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const identifier = dto.usernameOrEmail.toLowerCase().trim();

    // First try staff login
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.clinic', 'clinic')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :identifier OR LOWER(user.username) = :identifier', {
        identifier,
      })
      .getOne();

    if (user) {
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (isPasswordValid) {
        if (user.status === 'inactive') {
          throw new UnauthorizedException('This staff account has been deactivated by the clinic.');
        }
        const accessToken = this.generateStaffAccessToken(user);
        const refreshToken = await this.createAndSaveRefreshToken(
          { userId: user.id, clinicId: user.clinicId, accountType: 'staff' },
          ipAddress,
          userAgent,
        );
        const { passwordHash: _, refreshTokens: __, clinic, ...userProfile } = user;
        return {
          user: { ...userProfile, clinicName: clinic?.name, type: 'staff' },
          accessToken,
          refreshToken,
          expiresIn: 900,
          accountType: 'staff',
        };
      }
    }

    // Next try clinic login
    const clinic = await this.clinicsRepository
      .createQueryBuilder('clinic')
      .addSelect('clinic.passwordHash')
      .where('LOWER(clinic.email) = :identifier', { identifier })
      .getOne();

    if (clinic) {
      const isPasswordValid = await bcrypt.compare(dto.password, clinic.passwordHash);
      if (isPasswordValid) {
        const accessToken = this.generateClinicAccessToken(clinic);
        const refreshToken = await this.createAndSaveRefreshToken(
          { clinicId: clinic.id, accountType: 'clinic' },
          ipAddress,
          userAgent,
        );
        const { passwordHash: _, staff: __, ...clinicProfile } = clinic;
        return {
          user: {
            id: clinicProfile.id,
            name: clinicProfile.name,
            email: clinicProfile.email,
            username: clinicProfile.email,
            role: 'admin',
            title: 'Clinic Administrator',
            type: 'clinic',
            clinicId: clinicProfile.id,
            clinicName: clinicProfile.name,
          },
          accessToken,
          refreshToken,
          expiresIn: 900,
          accountType: 'clinic',
        };
      }
    }

    throw new UnauthorizedException('Invalid credentials. Please verify your email/username and password.');
  }

  /**
   * Legacy register method fallback
   */
  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    // If registered via legacy endpoint, treat as clinic registration if clinic-like or default admin
    return this.registerClinic(
      {
        clinicName: dto.name || dto.username,
        email: dto.email,
        password: dto.password,
        confirmPassword: dto.confirmPassword,
        ownerName: dto.name,
      },
      ipAddress,
      userAgent,
    );
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
    user: any;
    accountType?: string;
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
        `Revoked refresh token reuse attempted. Revoking all tokens for subject.`,
      );
      if (existingRecord.userId) {
        await this.refreshTokensRepository.update(
          { userId: existingRecord.userId },
          { isRevoked: true },
        );
      }
      if (existingRecord.clinicId) {
        await this.refreshTokensRepository.update(
          { clinicId: existingRecord.clinicId },
          { isRevoked: true },
        );
      }
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

    // Revoke the used refresh token
    await this.refreshTokensRepository.update(existingRecord.id, {
      isRevoked: true,
    });

    // Check account type
    if (existingRecord.accountType === 'clinic' || (!existingRecord.userId && existingRecord.clinicId)) {
      const clinic = await this.clinicsRepository.findOne({
        where: { id: existingRecord.clinicId },
      });
      if (!clinic) {
        throw new UnauthorizedException('Associated clinic account no longer exists.');
      }
      const newAccessToken = this.generateClinicAccessToken(clinic);
      const newRefreshToken = await this.createAndSaveRefreshToken(
        { clinicId: clinic.id, accountType: 'clinic' },
        ipAddress,
        userAgent,
      );
      const { passwordHash: _, staff: __, ...clinicProfile } = clinic;
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
        user: {
          id: clinicProfile.id,
          name: clinicProfile.name,
          email: clinicProfile.email,
          username: clinicProfile.email,
          role: 'admin',
          title: 'Clinic Administrator',
          type: 'clinic',
          clinicId: clinicProfile.id,
          clinicName: clinicProfile.name,
        },
        accountType: 'clinic',
      };
    }

    const user = existingRecord.user || (existingRecord.userId ? await this.usersRepository.findOne({ where: { id: existingRecord.userId }, relations: ['clinic'] }) : null);
    if (!user) {
      throw new UnauthorizedException('Associated staff account no longer exists.');
    }

    const newAccessToken = this.generateStaffAccessToken(user);
    const newRefreshToken = await this.createAndSaveRefreshToken(
      { userId: user.id, clinicId: user.clinicId, accountType: 'staff' },
      ipAddress,
      userAgent,
    );

    const { passwordHash: _, refreshTokens: __, clinic, ...userProfile } = user;

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      user: {
        ...userProfile,
        clinicName: clinic?.name,
        type: 'staff',
      },
      accountType: 'staff',
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
