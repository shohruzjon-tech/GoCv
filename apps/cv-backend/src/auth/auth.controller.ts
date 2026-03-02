import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { ApiKeyService } from './api-key.service.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import type { Request, Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private apiKeyService: ApiKeyService,
    private configService: ConfigService,
  ) {}

  // ─── Email/Password Auth ───

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      dto.email,
      dto.password,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // ─── Google OAuth ───

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user as any);
    const frontendUrl = this.configService.get<string>('frontendUrl');
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  // ─── Admin Login ───

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: AdminLoginDto, @Req() req: Request) {
    return this.authService.adminLogin(
      dto.email,
      dto.password,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
    return this.authService.logout(token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser('_id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('_id') userId: string,
    @Body()
    body: {
      name?: string;
      headline?: string;
      bio?: string;
      location?: string;
      website?: string;
      socialLinks?: { linkedin?: string; github?: string; twitter?: string };
    },
  ) {
    return this.authService.updateProfile(userId, body);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('_id') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @CurrentUser('_id') userId: string,
    @Body()
    body: {
      emailNotifications?: boolean;
      marketingEmails?: boolean;
      language?: string;
      timezone?: string;
    },
  ) {
    return this.authService.updatePreferences(userId, body);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getUserSessions(@CurrentUser('_id') userId: string) {
    return this.authService.getUserSessions(userId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async terminateSession(
    @CurrentUser('_id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.authService.terminateSession(userId, sessionId);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser('_id') userId: string,
    @Body() body: { password?: string },
  ) {
    return this.authService.deleteAccount(userId, body.password);
  }

  // ─── API Keys ───

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  async getApiKeys(@CurrentUser('_id') userId: string) {
    return this.apiKeyService.findByUser(userId);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  async createApiKey(
    @CurrentUser('_id') userId: string,
    @Body()
    body: {
      name: string;
      scopes: string[];
      expiresIn?: number;
      allowedIps?: string[];
    },
  ) {
    const result = await this.apiKeyService.createKey(
      userId,
      body.name,
      body.scopes as any[],
      undefined,
      body.expiresIn,
    );
    return { key: result.key, apiKey: result.apiKey };
  }

  @Post('api-keys/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
  ) {
    await this.apiKeyService.revokeKey(id, userId);
    return { message: 'API key revoked' };
  }

  @Post('api-keys/:id/rotate')
  @UseGuards(JwtAuthGuard)
  async rotateApiKey(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
  ) {
    const result = await this.apiKeyService.rotateKey(id, userId);
    return { key: result.key, apiKey: result.apiKey };
  }
}
