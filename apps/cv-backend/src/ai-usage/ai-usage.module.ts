import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiUsage, AiUsageSchema } from './schemas/ai-usage.schema.js';
import { AiUsageService } from './ai-usage.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiUsage.name, schema: AiUsageSchema }]),
  ],
  providers: [AiUsageService],
  exports: [AiUsageService],
})
export class AiUsageModule {}
