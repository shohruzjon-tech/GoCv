import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './schemas/template.schema.js';
import { TemplatesService } from './templates.service.js';
import { TemplatesController } from './templates.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule implements OnModuleInit {
  constructor(private templatesService: TemplatesService) {}

  async onModuleInit() {
    await this.templatesService.seedDefaults();
  }
}
