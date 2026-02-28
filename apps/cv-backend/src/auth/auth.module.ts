import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { ApiKeyService } from './api-key.service.js';
import { EmailService } from './email.service.js';
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema.js';
import {
  EmailVerification,
  EmailVerificationSchema,
} from './schemas/email-verification.schema.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    MongooseModule.forFeature([
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'jwt-secret-dev',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiration') ||
            '7d') as any,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    ApiKeyService,
    EmailService,
  ],
  controllers: [AuthController],
  exports: [AuthService, ApiKeyService, EmailService],
})
export class AuthModule {}
