import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FeatureFlag,
  FeatureFlagSchema,
} from './schemas/feature-flag.schema.js';
import { FeatureFlagsService } from './feature-flags.service.js';
import { FeatureFlagsController } from './feature-flags.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
    ]),
  ],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule implements OnModuleInit {
  constructor(private featureFlagsService: FeatureFlagsService) {}

  async onModuleInit() {
    await this.featureFlagsService.seedDefaults();
  }
}
