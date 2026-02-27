import { Module, Global } from '@nestjs/common';
import { AiOrchestratorService } from './ai-orchestrator.service.js';
import { PromptRegistryService } from './prompt-registry.service.js';

@Global()
@Module({
  providers: [AiOrchestratorService, PromptRegistryService],
  exports: [AiOrchestratorService, PromptRegistryService],
})
export class AiOrchestratorModule {}
