import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { CvModule } from './cv/cv.module.js';
import { AiModule } from './ai/ai.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { UploadModule } from './upload/upload.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
    }),
    AuthModule,
    UsersModule,
    SessionsModule,
    CvModule,
    AiModule,
    ProjectsModule,
    UploadModule,
    PdfModule,
    AdminModule,
  ],
})
export class AppModule {}
