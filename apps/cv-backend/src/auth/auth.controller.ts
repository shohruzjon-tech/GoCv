import {
  Controller,
  Get,
  Post,
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
import type { Request, Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private apiKeyService: ApiKeyService,
    private configService: ConfigService,
  ) {}

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
