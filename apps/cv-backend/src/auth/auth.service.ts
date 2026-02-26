import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { Role } from '../common/enums/role.enum.js';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
        // Link Google account to existing user
        await this.usersService.update(user._id.toString(), {
          ...({} as any),
        });
        user.googleId = googleUser.googleId;
        await user.save();
      } else {
        // Create new user
        user = await this.usersService.create({
          ...googleUser,
          role: Role.USER,
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
