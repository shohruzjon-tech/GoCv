import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { EmailService } from './email.service.js';
import {
  EmailVerification,
  EmailVerificationDocument,
} from './schemas/email-verification.schema.js';
import { Role } from '../common/enums/role.enum.js';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    @InjectModel(EmailVerification.name)
    private emailVerificationModel: Model<EmailVerificationDocument>,
  ) {}

  // ─── Email/Password Registration ───

  async register(name: string, email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser && existingUser.isEmailVerified) {
      throw new ConflictException('An account with this email already exists');
    }

    if (existingUser && !existingUser.isEmailVerified) {
      // User registered but hasn't verified — update password & resend code
      await this.usersService.updatePassword(
        existingUser._id.toString(),
        password,
      );
      existingUser.name = name;
      await existingUser.save();
      this.sendVerificationCode(email).catch((err) =>
        this.logger.error(`Failed to send verification email: ${err.message}`),
      );
      return {
        message:
          'A verification code has been sent to your email. Please verify to complete registration.',
        requiresVerification: true,
      };
    }

    // Create new unverified user
    await this.usersService.create({
      name,
      email,
      password,
      role: Role.USER,
      isEmailVerified: false,
      username: email.split('@')[0] + '_' + Date.now().toString(36),
    });

    this.sendVerificationCode(email).catch((err) =>
      this.logger.error(`Failed to send verification email: ${err.message}`),
    );

    return {
      message:
        'A verification code has been sent to your email. Please verify to complete registration.',
      requiresVerification: true,
    };
  }

  // ─── Email Verification ───

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationCode(email: string): Promise<void> {
    // Invalidate any existing codes for this email
    await this.emailVerificationModel.updateMany(
      { email, used: false },
      { used: true },
    );

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.emailVerificationModel.create({ email, code, expiresAt });

    await this.emailService.sendVerificationCode(email, code);
    this.logger.log(`Verification code sent to ${email}`);
  }

  async verifyEmail(email: string, code: string) {
    const verification = await this.emailVerificationModel
      .findOne({ email, code, used: false })
      .sort({ createdAt: -1 })
      .exec();

    if (!verification) {
      throw new BadRequestException('Invalid verification code');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    if (verification.attempts >= 5) {
      throw new BadRequestException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // Mark code as used
    verification.used = true;
    await verification.save();

    // Mark user as verified
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.usersService.setEmailVerified(user._id.toString(), true);

    // Auto-login after verification
    await this.usersService.updateLastLogin(user._id.toString());
    return this.generateTokenAndSession(user, undefined, undefined);
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return {
        message:
          'If this email is registered, a verification code has been sent.',
      };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Rate limit: check if a code was sent in the last 60 seconds
    const recentCode = await this.emailVerificationModel
      .findOne({
        email,
        used: false,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
      })
      .exec();

    if (recentCode) {
      throw new BadRequestException(
        'Please wait at least 60 seconds before requesting a new code.',
      );
    }

    await this.sendVerificationCode(email);
    return {
      message:
        'If this email is registered, a verification code has been sent.',
    };
  }

  // ─── Email/Password Login ───

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const user = await this.usersService.validatePassword(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    if (!user.isEmailVerified) {
      // Re-send verification code automatically
      await this.sendVerificationCode(email);
      throw new UnauthorizedException({
        message:
          'Please verify your email before logging in. A new verification code has been sent.',
        requiresVerification: true,
        email,
      });
    }

    await this.usersService.updateLastLogin(user._id.toString());
    return this.generateTokenAndSession(user, userAgent, ipAddress);
  }

  // ─── Google OAuth ───

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);
      if (user) {
        // Link Google account to existing email-registered user
        user.googleId = googleUser.googleId;
        if (googleUser.avatar && !user.avatar) {
          user.avatar = googleUser.avatar;
        }
        // If user registered via email but hasn't verified, verify them now
        // (Google OAuth already proves email ownership)
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
        }
        await user.save();
      } else {
        // Create new user via Google — already verified
        user = await this.usersService.create({
          ...googleUser,
          role: Role.USER,
          isEmailVerified: true,
          username:
            googleUser.email.split('@')[0] + '_' + Date.now().toString(36),
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    await this.usersService.updateLastLogin(user._id.toString());
    return this.generateTokenAndSession(user, undefined, undefined);
  }

  // ─── Admin Login ───

  async adminLogin(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const user = await this.usersService.validatePassword(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Admin access required');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    await this.usersService.updateLastLogin(user._id.toString());
    return this.generateTokenAndSession(user, userAgent, ipAddress);
  }

  // ─── Helpers ───

  private async generateTokenAndSession(
    user: any,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);
    const expiration = this.configService.get<string>('jwt.expiration') || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiration) || 7);

    await this.sessionsService.create({
      userId: user._id,
      token,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return {
      access_token: token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        username: user.username,
      },
    };
  }

  async logout(token: string) {
    const session = await this.sessionsService.findByToken(token);
    if (session) {
      await this.sessionsService.deactivate(session._id.toString());
    }
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      username: user.username,
      bio: user.bio,
      headline: user.headline,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
    };
  }
}
